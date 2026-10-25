"""Admin configuration.

This *is* the v1 CRUD interface. Registering the models with sensible list
columns, filters, search, and inline editing gives family maintainers a
usable management panel with no custom frontend code.
"""

from __future__ import annotations

from django.contrib import admin

from .models import Event, Parentage, Person, Union


class EventInline(admin.TabularInline):
    model = Event
    extra = 1
    fields = ("type", "date", "date_text", "place", "description")


class ParentLinkInline(admin.TabularInline):
    """Edit the parents of the person being viewed."""

    model = Parentage
    fk_name = "child"
    extra = 1
    autocomplete_fields = ("parent",)
    verbose_name = "Parent"
    verbose_name_plural = "Parents"


class ChildLinkInline(admin.TabularInline):
    """Edit the children of the person being viewed."""

    model = Parentage
    fk_name = "parent"
    extra = 1
    autocomplete_fields = ("child",)
    verbose_name = "Child"
    verbose_name_plural = "Children"


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("full_name", "gender", "birth_date", "death_date", "is_living", "birth_order")
    list_filter = ("gender", "is_living")
    search_fields = ("given_name", "nickname", "family_name", "maiden_name")
    readonly_fields = ("created_at", "updated_at")
    class Media:
        # Show/hide the death fields based on the "is living" checkbox.
        js = ("people/js/death_fields_toggle.js",)

    inlines = (ParentLinkInline, ChildLinkInline, EventInline)
    fieldsets = (
        (None, {"fields": ("given_name", "family_name", "maiden_name", "nickname", "gender")}),
        ("Life", {"fields": ("birth_date", "birth_place", "death_date", "death_place", "is_living","birth_order")}),
        ("Details", {"fields": ("bio", "photo")}),
        ("Meta", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )


@admin.register(Union)
class UnionAdmin(admin.ModelAdmin):
    list_display = ("partner_a", "partner_b", "kind", "status", "start_date", "end_date")
    list_filter = ("kind", "status")
    autocomplete_fields = ("partner_a", "partner_b")
    search_fields = (
        "partner_a__given_name", "partner_a__family_name",
        "partner_b__given_name", "partner_b__family_name",
    )


@admin.register(Parentage)
class ParentageAdmin(admin.ModelAdmin):
    list_display = ("parent", "child", "kind")
    list_filter = ("kind",)
    autocomplete_fields = ("parent", "child")
    search_fields = (
        "parent__given_name", "parent__family_name",
        "child__given_name", "child__family_name",
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("person", "type", "date", "date_text", "place")
    list_filter = ("type",)
    autocomplete_fields = ("person",)
    search_fields = ("person__given_name", "person__family_name", "description")
