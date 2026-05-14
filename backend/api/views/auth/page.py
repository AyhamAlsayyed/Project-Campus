import re

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from ...models import Page

User = get_user_model()


def get_tokens_for_user(user):
    """Generate JWT tokens for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def page_register(request):
    """Register a new page (creates both User and Page)"""
    username = (request.data.get("username") or "").strip().lower()
    password = request.data.get("password")
    page_full_name = (request.data.get("page_full_name") or "").strip()
    page_type = request.data.get("page_type", "other")
    email = (request.data.get("email") or "").strip().lower()

    # Validate input
    if not username or not password or not page_full_name:
        return Response(
            {"message": "username, password, and page_full_name are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate username format
    if not re.fullmatch(r"[a-z0-9_]+", username):
        return Response(
            {"message": "Username must contain only lowercase letters, numbers, and underscores"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate password length
    if len(password) < 8:
        return Response(
            {"message": "Password must be at least 8 characters long"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check username uniqueness
    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {"message": "Username already taken"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check email uniqueness (optional)
    if email and User.objects.filter(email__iexact=email).exists():
        return Response(
            {"message": "Email already in use"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
        )

        # Create page linked to user
        page = Page.objects.create(
            user=user,
            page_full_name=page_full_name,
            page_name=username,
            page_type=page_type,
            email=email,
        )

        # Generate tokens
        tokens = get_tokens_for_user(user)

        return Response(
            {
                "message": "Page registered successfully",
                "user_id": user.id,
                "page_id": page.page_id,
                "username": username,
                "page_full_name": page_full_name,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response(
            {"message": f"Registration failed: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def page_login(request):
    """Login as a page"""
    username = (request.data.get("username") or "").strip().lower()
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"message": "username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(username__iexact=username)
    except User.DoesNotExist:
        return Response(
            {"message": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Verify password
    if not user.check_password(password):
        return Response(
            {"message": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Check if user has an associated page
    page = getattr(user, "page_profile", None)
    if not page:
        return Response(
            {"message": "This account is not associated with a page"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    tokens = get_tokens_for_user(user)

    return Response(
        {
            "message": "Login successful",
            "user_id": user.id,
            "page_id": page.page_id,
            "username": username,
            "page_full_name": page.page_full_name,
            "tokens": tokens,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def page_logout(request):
    """Logout a page user"""
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response(
            {"message": "Logout successful"},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"message": f"Logout failed: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def page_me(request):
    """Get current page user info"""
    user = request.user
    page = getattr(user, "page_profile", None)

    if not page:
        return Response(
            {"error": "User is not associated with a page"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    avatar = None
    if page.profile_image:
        try:
            avatar = request.build_absolute_uri(page.profile_image.url)
        except Exception:
            avatar = None

    cover = None
    if page.banner_image:
        try:
            cover = request.build_absolute_uri(page.banner_image.url)
        except Exception:
            cover = None

    return Response(
        {
            "user_id": user.id,
            "page_id": page.page_id,
            "username": user.username,
            "page_full_name": page.page_full_name,
            "page_name": page.page_name,
            "page_type": page.page_type,
            "email": page.email or user.email,
            "phone": page.phone,
            "location": page.location,
            "description": page.description,
            "avatar": avatar,
            "cover": cover,
            "verified": page.verified,
            "created_at": page.created_at.isoformat(),
        },
        status=status.HTTP_200_OK,
    )
