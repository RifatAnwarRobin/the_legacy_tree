"""Load the worked example family (John, Mary, David, ...).

Run with:  python manage.py seed_example

Idempotent-ish: pass --reset to clear existing people first. This exists so
anyone cloning the repo can see a populated, non-trivial tree — including
remarriage, half-siblings, and adoption — within seconds.
"""

from __future__ import annotations

from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.people.models import Event, Parentage, Person, Union


class Command(BaseCommand):
    help = "Seed the database with the worked example family."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing people before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        if options["reset"]:
            Person.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared existing people."))

        def person(given, family, gender, **kw) -> Person:
            return Person.objects.create(
                given_name=given, family_name=family, gender=gender, **kw
            )

        john = person("John", "Smith", "M", birth_date=date(1940, 3, 12),
                      birth_place="Leeds", death_date=date(2015, 8, 20),
                      is_living=False)
        mary = person("Mary", "Smith", "F", maiden_name="Brown",
                      birth_date=date(1943, 7, 1), birth_place="York")
        david = person("David", "Smith", "M", birth_date=date(1968, 5, 22),
                       birth_place="Leeds")
        emma = person("Emma", "Clarke", "F", maiden_name="Clarke",
                      birth_date=date(1970, 1, 15), birth_place="Manchester")
        priya = person("Priya", "Smith", "F", maiden_name="Sharma",
                       birth_date=date(1975, 11, 30), birth_place="London")
        liam = person("Liam", "Smith", "M", birth_date=date(1995, 9, 10),
                      birth_place="Leeds")
        aria = person("Aria", "Smith", "F", birth_date=date(2005, 4, 18),
                      birth_place="London")
        noah = person("Noah", "Smith", "M", birth_date=date(2008, 2, 25),
                      birth_place="London")

        # Mary's parents — David's maternal grandparents (from the mother's side).
        robert = person("Robert", "Brown", "M", birth_date=date(1915, 2, 8),
                        birth_place="York", death_date=date(1998, 6, 1),
                        is_living=False)
        susan = person("Susan", "Brown", "F", maiden_name="Taylor",
                       birth_date=date(1919, 10, 20), birth_place="Hull",
                       death_date=date(2001, 3, 14), is_living=False)


        # Parentage edges (two parents per child).
        bio = Parentage.Kind.BIOLOGICAL
        Parentage.objects.create(parent=robert, child=mary, kind=bio)
        Parentage.objects.create(parent=susan, child=mary, kind=bio)
        Parentage.objects.create(parent=john, child=david, kind=bio)
        Parentage.objects.create(parent=mary, child=david, kind=bio)
        Parentage.objects.create(parent=david, child=liam, kind=bio)
        Parentage.objects.create(parent=emma, child=liam, kind=bio)
        Parentage.objects.create(parent=david, child=aria, kind=bio)
        Parentage.objects.create(parent=priya, child=aria, kind=bio)
        Parentage.objects.create(parent=david, child=noah, kind=Parentage.Kind.ADOPTIVE)
        Parentage.objects.create(parent=priya, child=noah, kind=Parentage.Kind.ADOPTIVE)

        # Unions (David's first marriage ended; second is current).
        Union.objects.create(partner_a=john, partner_b=mary,
                             start_date=date(1965, 6, 12),
                             status=Union.Status.MARRIED)
        Union.objects.create(partner_a=david, partner_b=emma,
                             start_date=date(1993, 4, 3), end_date=date(2003, 11, 20),
                             status=Union.Status.DIVORCED)
        Union.objects.create(partner_a=david, partner_b=priya,
                             start_date=date(2004, 8, 15),
                             status=Union.Status.MARRIED)

        # A few events showing the flexible facts model.
        Event.objects.create(person=john, type=Event.Type.OCCUPATION,
                             date_text="1960", place="Leeds", description="Coal miner")
        Event.objects.create(person=david, type=Event.Type.EDUCATION,
                             date_text="1990", place="Leeds University",
                             description="BSc Engineering")
        Event.objects.create(person=david, type=Event.Type.OCCUPATION,
                             date_text="1991", description="Civil engineer")
        Event.objects.create(person=priya, type=Event.Type.OCCUPATION,
                             date_text="2000", place="London", description="Doctor")
        Event.objects.create(person=liam, type=Event.Type.IMMIGRATION,
                             date_text="2018", place="Toronto",
                             description="Moved to Canada for work")
        Event.objects.create(person=david, type=Event.Type.ACHIEVEMENT,
                             date_text="2010", description="Chartered Engineer status")
        Event.objects.create(person=priya, type=Event.Type.AWARD,
                             date_text="2015", place="London",
                             description="NHS Clinical Excellence Award")

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {Person.objects.count()} people, "
            f"{Parentage.objects.count()} parent-child links, "
            f"{Union.objects.count()} unions, {Event.objects.count()} events."
        ))
