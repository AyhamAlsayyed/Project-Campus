from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = (request.data.get("username") or "").strip().lower()
    password = request.data.get("password") or ""

    if not username or not password:
        return Response(
            {"message": "username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({"message": "Account disabled"}, status=status.HTTP_403_FORBIDDEN)

    token, _ = Token.objects.get_or_create(user=user)

    profile = getattr(user, "profile", None)

    return Response(
        {
            "message": "Login successful",
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "avatar": getattr(profile, "profile_image", None) if profile else None,
            },
        },
        status=status.HTTP_200_OK,
    )
