# The Legacy Tree

A self-hostable family tree application. Family members maintain the tree
through a management interface; every person can hold arbitrary biographical
information, and relationships (including remarriage, half-siblings, and
adoption) are modelled correctly as a graph.

This repository is **v1**: a Django backend with an admin-first CRUD
interface, PostgreSQL, and Docker. Later phases add a REST API, a React UI
with a visualisation tab, and role-based accounts (see the roadmap).

## Stack

| Layer      | Choice                     | Why |
|------------|----------------------------|-----|
| Backend    | Django 5                   | ORM, auth/permissions, and a free admin CRUD |
| Database   | PostgreSQL 16              | Handles the family graph comfortably |
| Packaging  | Docker + Compose           | Runs unchanged on any host |
| Tests      | pytest + pytest-django     | Fast, readable |
| Lint       | ruff                       | Single fast linter/formatter |

## The data model

A family is a **graph**, not a simple tree. Four models capture it:

- **Person** — the nodes. Core fields plus a photo and biography.
- **Parentage** — a directed `parent → child` edge (`kind`: biological,
  adoptive, step, foster, guardian). Two rows per child, so two parents,
  unknown parents, and blended families all work.
- **Union** — a partnership between two people, with dates and status.
  Ended relationships are kept, so remarriage and history survive.
- **Event** — a dated fact (occupation, education, immigration, ...). The
  extensible tail: *any* information is a new row, never a schema change.

Derived relationships (siblings, cousins) are **computed** from the edges in
`apps/people/services.py`, never stored.

## Quickstart — Docker (recommended)

```bash
cp .env.example .env          # then edit DJANGO_SECRET_KEY
docker compose up --build     # starts Postgres + the web app
```

Then, in another terminal, create an admin login and load the example family:

```bash
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py seed_example
```

Open http://localhost:8000/admin/ and sign in.

## Quickstart — local (no Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py seed_example          # optional demo data
python manage.py createsuperuser
python manage.py runserver
```

With no `POSTGRES_DB` in the environment the app uses SQLite automatically,
so local development and tests need no database server.

## Tests & lint

```bash
cd backend
pytest          # runs the suite on SQLite
ruff check .    # lint
```

## Project structure

```
family-tree/
  backend/
    config/            # settings (env-driven), urls, wsgi/asgi
    apps/people/
      models.py        # Person, Parentage, Union, Event
      admin.py         # the v1 CRUD interface
      services.py      # relationship traversal (siblings, partners, ...)
      management/commands/seed_example.py
      tests/
    Dockerfile
    entrypoint.sh
    requirements*.txt
  docker-compose.yml
  .github/workflows/ci.yml
  .env.example
```

## Roadmap

- **v1 (this repo)** — models, admin CRUD, Postgres, Docker, tests, CI.
- **v2** — REST API (Django REST Framework) + React/TypeScript UI.
- **v3** — visualisation tab (interactive family graph).
- **v4** — user accounts with role-based permissions (viewer / editor / admin).
- **v5** — deployment, polish, optional natural-language query service.

## Notes

- Secrets come from the environment; nothing sensitive is committed. In
  production the app refuses to start with the insecure dev key.
- The container runs as a non-root user and serves static files via
  WhiteNoise.
