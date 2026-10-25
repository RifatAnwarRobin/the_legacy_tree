"""Tests for derived-relationship logic against the worked example family."""

from __future__ import annotations

import pytest
from django.core.management import call_command

from apps.people import services
from apps.people.models import Person

pytestmark = pytest.mark.django_db


@pytest.fixture
def family() -> dict[str, Person]:
    call_command("seed_example")
    return {p.given_name: p for p in Person.objects.all()}


def test_david_has_two_parents(family) -> None:
    parents = {p.given_name for p in services.get_parents(family["David"])}
    assert parents == {"John", "Mary"}


def test_david_has_three_children(family) -> None:
    children = {c.given_name for c in services.get_children(family["David"])}
    assert children == {"Liam", "Aria", "Noah"}


def test_david_has_two_partners_across_unions(family) -> None:
    partners = {p.given_name for p in services.get_partners(family["David"])}
    assert partners == {"Emma", "Priya"}


def test_liam_and_aria_are_half_siblings(family) -> None:
    # They share David but not the second parent.
    half = {s.given_name for s in services.get_siblings(family["Liam"], half=True)}
    full = {s.given_name for s in services.get_siblings(family["Liam"], half=False)}
    assert "Aria" in half
    assert "Aria" not in full  # not a full sibling — different mothers


def test_describe_composes_nested_shape(family) -> None:
    data = services.describe(family["David"])
    assert data["name"] == "David Smith"
    assert len(data["parents"]) == 2
    assert len(data["children"]) == 3
    assert {e["type"] for e in data["events"]} >= {"Education", "Occupation"}

def test_maternal_side_follows_the_mother(family) -> None:
    maternal = {p.given_name for p in services.get_ancestors(family["David"], side="maternal")}
    assert maternal == {"Mary", "Robert", "Susan"}


def test_paternal_side_follows_the_father(family) -> None:
    paternal = {p.given_name for p in services.get_ancestors(family["David"], side="paternal")}
    assert paternal == {"John"}


def test_all_ancestors_covers_both_sides(family) -> None:
    everyone = {p.given_name for p in services.get_ancestors(family["David"], side="all")}
    assert everyone == {"John", "Mary", "Robert", "Susan"}