from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from ...models import Page, Subscription


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
        return Response(
            {"message": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"message": "Account disabled"},
            status=status.HTTP_403_FORBIDDEN,
        )

    refresh = RefreshToken.for_user(user)
    access = refresh.access_token

    is_page = False
    is_premium = False
    user_type = "user"
    avatar = None

    try:
        if hasattr(user, "page") and user.page:
            is_page = True
            user_type = "page"

            if hasattr(user.page, "subscription") and user.page.subscription.is_active:
                tier = user.page.subscription.tier

                if tier in [Subscription.Tier.PREMIUM, Subscription.Tier.UNIVERSITY]:
                    is_premium = True

                if tier == Subscription.Tier.UNIVERSITY:
                    user_type = "uni"

            if getattr(user.page, "profile_image", None):
                try:
                    avatar = request.build_absolute_uri(user.page.profile_image.url)
                except Exception:
                    avatar = None
    except Page.DoesNotExist:
        is_page = False

    if not is_page:
        profile = getattr(user, "profile", None)
        if profile and getattr(profile, "profile_image", None):
            try:
                avatar = request.build_absolute_uri(profile.profile_image.url)
            except Exception:
                avatar = None

    return Response(
        {
            "message": "Login successful",
            "access": str(access),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "avatar": avatar,
                "user_type": user_type,
                "is_premium": is_premium,
            },
        },
        status=status.HTTP_200_OK,
    )
