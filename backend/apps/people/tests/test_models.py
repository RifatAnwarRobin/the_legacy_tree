"""Tests for model constraints and integrity."""

from __future__ import annotations

from datetime import date

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.people.models import Parentage, Person, Union

pytestmark = pytest.mark.django_db


def make(given: str, family: str = "Test", **kw) -> Person:
    return Person.objects.create(given_name=given, family_name=family, **kw)


def test_full_name_and_str() -> None:
    p = make("David", "Smith", birth_date=date(1968, 5, 22))
    assert p.full_name == "David Smith"
    assert "1968" in str(p)


def test_person_cannot_die_before_birth() -> None:
    p = Person(given_name="X", birth_date=date(2000, 1, 1), death_date=date(1990, 1, 1))
    with pytest.raises(ValidationError):
        p.clean()


def test_duplicate_parent_child_link_rejected() -> None:
    parent, child = make("P"), make("C")
    Parentage.objects.create(parent=parent, child=child)
    with pytest.raises(IntegrityError):
        Parentage.objects.create(parent=parent, child=child)


def test_person_cannot_be_own_parent() -> None:
    p = make("Solo")
    with pytest.raises(IntegrityError):
        Parentage.objects.create(parent=p, child=p)


def test_person_cannot_union_with_self() -> None:
    p = make("Solo")
    with pytest.raises(IntegrityError):
        Union.objects.create(partner_a=p, partner_b=p)

def test_living_person_cannot_have_death_date_validation() -> None:
    p = Person(given_name="Alive", is_living=True, death_date=date(2020, 1, 1))
    with pytest.raises(ValidationError):
        p.clean()


def test_recording_death_date_marks_person_not_living() -> None:
    p = make("Late", is_living=True, death_date=date(2020, 1, 1))
    p.refresh_from_db()
    assert p.is_living is False


def test_living_person_with_death_date_rejected_by_database() -> None:
    with pytest.raises(IntegrityError):
        Person.objects.bulk_create(
            [Person(given_name="Ghost", is_living=True, death_date=date(1999, 1, 1))]
        )