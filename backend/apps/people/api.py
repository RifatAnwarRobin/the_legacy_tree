from __future__ import annotations

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from . import serializers, services
from .models import Event, Parentage, Person, Union


class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all()
    serializer_class = serializers.PersonSerializer

    @action(detail=True)
    def detail_full(self, request, pk=None):
        """GET /api/people/{id}/detail_full/ — nested person (describe())."""
        return Response(services.describe(self.get_object()))

    @action(detail=True)
    def ancestors(self, request, pk=None):
        """GET /api/people/{id}/ancestors/?side=maternal|paternal|all"""
        side = request.query_params.get("side", "all")
        people = services.get_ancestors(self.get_object(), side=side)
        return Response(serializers.PersonSerializer(people, many=True).data)


class ParentageViewSet(viewsets.ModelViewSet):
    queryset = Parentage.objects.select_related("parent", "child").all()
    serializer_class = serializers.ParentageSerializer


class UnionViewSet(viewsets.ModelViewSet):
    queryset = Union.objects.select_related("partner_a", "partner_b").all()
    serializer_class = serializers.UnionSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.select_related("person").all()
    serializer_class = serializers.EventSerializer


class GraphView(APIView):
    """GET /api/graph/ — the whole tree as nodes + edges (React Flow shape)."""

    def get(self, request):
        nodes = [
            {
                "id": str(p.id),
                "data": {
                    "label": p.full_name,
                    "gender": p.gender,
                    "is_living": p.is_living,
                    "birth_date": p.birth_date.isoformat() if p.birth_date else None,
                },
            }
            for p in Person.objects.all()
        ]

        edges = []
        for pc in Parentage.objects.all():
            edges.append({
                "id": f"parent-{pc.id}",
                "source": str(pc.parent_id),
                "target": str(pc.child_id),
                "relation": "parent",
                "kind": pc.kind,
            })
        for u in Union.objects.all():
            edges.append({
                "id": f"union-{u.id}",
                "source": str(u.partner_a_id),
                "target": str(u.partner_b_id),
                "relation": "union",
                "status": u.status,
            })

        return Response({"nodes": nodes, "edges": edges})