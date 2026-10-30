from __future__ import annotations

import pytest
from django.contrib.auth.models import User
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.people.models import Person

pytestmark = pytest.mark.django_db


@pytest.fixture
def family() -> None:
    call_command("seed_example")


@pytest.fixture
def client() -> APIClient:
    return APIClient()


def test_list_people_is_paginated(client, family) -> None:
    response = client.get("/api/people/")
    assert response.status_code == 200
    assert response.data["count"] == 10


def test_graph_returns_nodes_and_edges(client, family) -> None:
    response = client.get("/api/graph/")
    assert response.status_code == 200
    assert len(response.data["nodes"]) == 10
    assert len(response.data["edges"]) == 13


def test_ancestors_maternal_endpoint(client, family) -> None:
    david = Person.objects.get(given_name="David")
    response = client.get(f"/api/people/{david.id}/ancestors/?side=maternal")
    names = {p["given_name"] for p in response.data}
    assert names == {"Mary", "Robert", "Susan"}


def test_writes_require_authentication(client) -> None:
    response = client.post("/api/people/", {"given_name": "Nobody"})
    assert response.status_code in (401, 403)


def test_authenticated_user_can_create_person(family) -> None:
    user = User.objects.create_superuser("admin", "a@example.com", "pass-123456")
    client = APIClient()
    client.force_authenticate(user)
    response = client.post("/api/people/", {"given_name": "New", "gender": "U"})
    assert response.status_code == 201
    assert response.data["full_name"] == "New"