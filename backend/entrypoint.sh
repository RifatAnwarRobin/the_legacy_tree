#!/usr/bin/env bash
set -e

# Apply migrations, collect static, then serve.
python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
