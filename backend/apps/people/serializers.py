from __future__ import annotations
from rest_framework import serializers
from .models import Event, Parentage, Person, Union


class PersonSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    gender_display = serializers.CharField(source="get_gender_display", read_only=True)

    class Meta:
        model = Person
        fields = [
            "id", "given_name", "family_name", "maiden_name", "full_name",
            "gender", "gender_display", "birth_date", "birth_place",
            "death_date", "death_place", "is_living", "birth_order", "bio", "photo",
        ]

class ParentageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parentage
        # fields = ["id", "parent", "child", "kind"]
        # or "__all__" to add all fields
        fields = "__all__"


class UnionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Union
        fields = ["id", "partner_a", "partner_b", "kind", "status",
                  "start_date", "end_date"]


class EventSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Event
        fields = ["id", "person", "type", "type_display", "date", "date_text",
                  "place", "description"]