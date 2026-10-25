"""Data model for the family tree.

A family is a *graph*, not a simple tree: a child can have two parents, a
person can have several partnerships over time, and relationships come in
kinds (biological, adoptive, step, ...). Modelling it as typed *edges*
between Person nodes keeps every one of those cases natural:

    Person      -- the nodes (one row per human)
    Parentage   -- directed parent -> child edge (two rows per child)
    Union       -- partnership edge between two people (keeps history)
    Event       -- flexible facts about a person (any info, no schema churn)

Derived relationships (siblings, cousins, "how are X and Y related") are
never stored; they are computed by traversing these edges. See services.py.
"""

from __future__ import annotations

import uuid

from django.core.exceptions import ValidationError
from django.db import models


class Person(models.Model):
    """A single person — a node in the family graph."""

    class Gender(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        OTHER = "O", "Other"
        UNKNOWN = "U", "Unknown"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    given_name = models.CharField(max_length=120)
    family_name = models.CharField(max_length=120, blank=True)
    maiden_name = models.CharField(max_length=120, blank=True, help_text="Family name at birth, if different.")
    nickname = models.CharField(max_length=120, blank=True, help_text="Name usually the person is called")
    gender = models.CharField(max_length=1, choices=Gender.choices, default=Gender.UNKNOWN)

    birth_order = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Rank among siblings.(if lower it means older).",
    )
    birth_date = models.DateField(null=True, blank=True)
    birth_place = models.CharField(max_length=200, blank=True)
    death_date = models.DateField(null=True, blank=True)
    death_place = models.CharField(max_length=200, blank=True)
    is_living = models.BooleanField(default=True,help_text="Uncheck to record death details. A living person cannot have a death date.")

    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to="people/photos/", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["family_name", "given_name"]
        verbose_name = "Person"
        verbose_name_plural = "People"
        constraints = [
            models.CheckConstraint(
                condition=~(
                    models.Q(is_living=True) & models.Q(death_date__isnull=False)
                ),
                name="living_person_has_no_death_date",
            ),
        ]

    def __str__(self) -> str:
        year = f" (b. {self.birth_date.year})" if self.birth_date else ""
        return f"{self.full_name}{year}"

    @property
    def full_name(self) -> str:
        return f"{self.given_name} {self.family_name}".strip()

    def clean(self) -> None:
        if self.death_date and self.birth_date and self.death_date < self.birth_date:
            raise ValidationError("Death date cannot be before birth date.")
        if self.is_living and (self.death_date or self.death_place):
            raise ValidationError(
                "A living person cannot have death details. "
                "Uncheck 'is living', or clear the death date and place."
            )

    def save(self, *args, **kwargs) -> None:
        # A death date always implies the person is not living.
        if self.death_date:
            self.is_living = False
        super().save(*args, **kwargs)


class Parentage(models.Model):
    """A directed parent -> child edge.

    Two rows normally exist per child (one per parent), which is exactly why
    a single ``father_id``/``mother_id`` pair on Person is *not* used: it
    cannot represent unknown parents, same-sex parents, or blended families.
    """

    class Kind(models.TextChoices):
        BIOLOGICAL = "biological", "Biological"
        ADOPTIVE = "adoptive", "Adoptive"
        STEP = "step", "Step"
        FOSTER = "foster", "Foster"
        GUARDIAN = "guardian", "Legal guardian"

    
    parent = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="child_links")
    child = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="parent_links")
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.BIOLOGICAL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["parent", "child"], name="unique_parent_child"),
            models.CheckConstraint(condition=~models.Q(parent=models.F("child")),name="parentage_no_self_link",),
        ]
        verbose_name = "Parent–child link"
        verbose_name_plural = "Parent–child links"

    def __str__(self) -> str:
        return f"{self.parent.full_name} → {self.child.full_name} ({self.kind})"

    def clean(self) -> None:
        if self.parent_id and self.parent_id == self.child_id:
            raise ValidationError("A person cannot be their own parent.")


class Union(models.Model):
    """A partnership between two people (marriage, civil union, etc.).

    Stored once per couple. Ended relationships are kept (with an end date and
    status) rather than deleted, so remarriage and family history survive.
    """

    class Kind(models.TextChoices):
        MARRIAGE = "marriage", "Marriage"
        CIVIL_UNION = "civil_union", "Civil union"
        PARTNERSHIP = "partnership", "Partnership"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        MARRIED = "married", "Married"
        PARTNERED = "partnered", "Partnered"
        SEPARATED = "separated", "Separated"
        DIVORCED = "divorced", "Divorced"
        WIDOWED = "widowed", "Widowed"
        ENDED = "ended", "Ended"

    partner_a = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="unions_as_a")
    partner_b = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="unions_as_b")
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.MARRIAGE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.MARRIED)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(partner_a=models.F("partner_b")),
                name="union_no_self_link",
            ),
        ]
        verbose_name = "Union"
        verbose_name_plural = "Unions"

    def __str__(self) -> str:
        return f"{self.partner_a.full_name} & {self.partner_b.full_name} ({self.status})"

    def clean(self) -> None:
        if self.partner_a_id and self.partner_a_id == self.partner_b_id:
            raise ValidationError("A person cannot be in a union with themselves.")
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date.")


class Event(models.Model):
    """A dated fact about a person.

    The extensible tail of the model: occupation, education, immigration,
    military service, religion, medical notes — anything — is a row here, so
    "any information can be inputted" never requires a schema change. This is
    how established genealogy tools (and the GEDCOM standard) model facts.
    """

    class Type(models.TextChoices):
        BIRTH = "birth", "Birth"
        DEATH = "death", "Death"
        MARRIAGE = "marriage", "Marriage"
        EDUCATION = "education", "Education"
        ACHIEVEMENT = "achievement", "Achievement"
        AWARD = "award", "Award"
        OCCUPATION = "occupation", "Occupation"
        RESIDENCE = "residence", "Residence"
        IMMIGRATION = "immigration", "Immigration"
        MILITARY = "military", "Military service"
        RELIGION = "religion", "Religion"
        MEDICAL = "medical", "Medical"
        OTHER = "other", "Other"

    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="events")
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.OTHER)
    date = models.DateField(null=True, blank=True)
    date_text = models.CharField(max_length=100, blank=True, 
        help_text="Free-text date for approximate values, e.g. 'circa 1960'.",)
    place = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "created_at"]
        verbose_name = "Event / fact"
        verbose_name_plural = "Events / facts"

    def __str__(self) -> str:
        when = self.date_text or (self.date.isoformat() if self.date else "n.d.")
        return f"{self.person.full_name} — {self.get_type_display()} ({when})"
