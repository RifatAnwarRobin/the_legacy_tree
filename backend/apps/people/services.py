"""Relationship queries.

Logic that traverses the family graph lives here, kept out of both
the models and the views so it is easy to test and reuse. Every relationship
below is *derived* from Parentage / Union edges — none of it is stored.
"""

from __future__ import annotations
from datetime import date
from .models import Person


def get_parents(person: Person) -> list[Person]:
    """Return the people recorded as parents of ``person``."""
    return [link.parent for link in person.parent_links.select_related("parent")]


def get_children(person: Person) -> list[Person]:
    """Return the people recorded as children of ``person``."""
    return [link.child for link in person.child_links.select_related("child")]


def get_partners(person: Person) -> list[Person]:
    """Return every partner across all of ``person``'s unions."""
    partners: list[Person] = []
    for union in person.unions_as_a.select_related("partner_b"):
        partners.append(union.partner_b)
    for union in person.unions_as_b.select_related("partner_a"):
        partners.append(union.partner_a)
    return partners


def get_siblings(person: Person, *, half: bool = True) -> list[Person]:
    """Return siblings, computed from shared parents.

    A *full* sibling shares every parent; a *half* sibling shares at least
    one. With ``half=True`` (default) both are returned; with ``half=False``
    only full siblings are returned.
    """
    my_parents = {p.pk for p in get_parents(person)}
    if not my_parents:
        return []

    candidates: dict = {}
    for parent_pk in my_parents:
        parent = Person.objects.get(pk=parent_pk)
        for child in get_children(parent):
            if child.pk != person.pk:
                candidates.setdefault(child.pk, child)

    siblings: list[Person] = []
    for candidate in candidates.values():
        shared = {p.pk for p in get_parents(candidate)} & my_parents
        if half or shared == my_parents:
            siblings.append(candidate)
    return siblings

def relationship_label(person: Person, relative: Person) -> str:
    """How `person` relates to `relative`, from person's side. Derived, not stored."""
    if person.parent_links.filter(parent=relative).exists():
        return {"M": "son", "F": "daughter"}.get(person.gender, "child")
    if person.child_links.filter(child=relative).exists():
        return {"M": "father", "F": "mother"}.get(person.gender, "parent")
    return "relative"

def ordinal_among_same_gender(person: Person) -> int | None:
    """E.g. returns 2 for the second son. Derived from siblings + gender."""
    same = [s for s in get_siblings(person) if s.gender == person.gender]
    same.append(person)
    same.sort(key=lambda p: (p.birth_date or date.max, p.birth_order or 999))
    return same.index(person) + 1

def get_ancestors(person: Person, side: str = "all") -> list[Person]:
    """Return a person's ancestors, optionally restricted to one side.

    side: "maternal", "paternal", or "all" (default).
    """
    parents = get_parents(person)
    if side == "maternal":
        roots = [p for p in parents if p.gender == Person.Gender.FEMALE]
    elif side == "paternal":
        roots = [p for p in parents if p.gender == Person.Gender.MALE]
    else:
        roots = parents

    seen: dict = {}

    def walk(people: list[Person]) -> None:
        for p in people:
            if p.pk in seen:
                continue
            seen[p.pk] = p
            walk(get_parents(p))

    walk(roots)
    return list(seen.values())

def describe(person: Person) -> dict:
    """Assemble a person into the nested shape a UI or API would render.

    The database stores flat, normalised edges; this composes them into one
    object — the separation the whole design rests on.
    """
    return {
        "id": str(person.pk),
        "name": person.full_name,
        "gender": person.get_gender_display(),
        "birth": {
            "date": person.birth_date.isoformat() if person.birth_date else None,
            "place": person.birth_place or None,
        },
        "parents": [
            {"id": str(p.pk), "name": p.full_name} for p in get_parents(person)
        ],
        "children": [
            {"id": str(c.pk), "name": c.full_name} for c in get_children(person)
        ],
        "partners": [
            {"id": str(pt.pk), "name": pt.full_name} for pt in get_partners(person)
        ],
        "events": [
            {
                "type": e.get_type_display(),
                "date": e.date_text or (e.date.isoformat() if e.date else None),
                "place": e.place or None,
                "description": e.description or None,
            }
            for e in person.events.all()
        ],
    }
