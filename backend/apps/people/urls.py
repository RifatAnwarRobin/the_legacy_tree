from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from . import api

router = DefaultRouter()
router.register("people", api.PersonViewSet)
router.register("parentages", api.ParentageViewSet)
router.register("unions", api.UnionViewSet)
router.register("events", api.EventViewSet)

urlpatterns = [
    path("graph/", api.GraphView.as_view(), name="graph"),
    *router.urls,
]