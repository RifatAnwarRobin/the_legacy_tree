from django.urls import path

from . import api

urlpatterns = [
    path("csrf/", api.CsrfView.as_view(), name="csrf"),
    path("me/", api.MeView.as_view(), name="me"),
    path("login/", api.LoginView.as_view(), name="login"),
    path("logout/", api.LogoutView.as_view(), name="logout"),
]
