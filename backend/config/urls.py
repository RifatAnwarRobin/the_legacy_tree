"""Root URL configuration.

v1 exposes the Django admin only — that is the "admin-first" CRUD interface
family maintainers use. The REST API (for the React UI) is added in v2.
"""

from django.contrib import admin
from django.urls import path

admin.site.site_header = "The Legacy Tree Admin"
admin.site.site_title = "The Legacy Tree"
admin.site.index_title = "Manage The Family Tree"

urlpatterns = [
    path("admin/", admin.site.urls),
]
