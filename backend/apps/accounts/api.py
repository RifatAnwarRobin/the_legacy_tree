"""Authentication endpoints (session-based).

Login required for the whole API means the family tree is private: nothing is
visible without signing in. Django handles password hashing and session
security; these views just expose login / logout / "who am I" to the React app.
"""

from __future__ import annotations

from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView


def user_payload(user) -> dict:
    """The safe subset of a user the frontend is allowed to know."""
    return {
        "username": user.get_username(),
        "name": user.get_full_name() or user.get_username(),
        "is_admin": user.is_superuser,
        # Group names map to roles later (viewer / contributor / admin).
        "roles": list(user.groups.values_list("name", flat=True)),
    }


@method_decorator(ensure_csrf_cookie, name="get")
class CsrfView(APIView):
    """GET once on app load to plant the CSRF cookie the frontend reads."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"detail": "CSRF cookie set."})


class MeView(APIView):
    """Returns the current user, or 401 if not logged in."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(user_payload(request.user))


class LoginView(APIView):
    """Log in with username + password; starts a session."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        login(request, user)
        return Response(user_payload(user))


class LogoutView(APIView):
    """End the current session."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out."})
