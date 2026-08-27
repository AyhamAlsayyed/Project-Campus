from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ....models import (
    EmailVerification,
    Instructor,
    Student,
    UniversityDomain,
    UserProfile,
)

User = get_user_model()


def get_email_domain(email: str) -> str:
    email = (email or "").strip().lower()
    if "@" not in email:
        return ""
    return email.split("@", 1)[1]


def get_university_row_from_email(email: str):
    domain = get_email_domain(email)
    if not domain:
        return None

    return UniversityDomain.objects.filter(domain=domain, is_active=True).first()


def resolve_role_from_domain(domain: str) -> str:
    return "student" if "students" in domain else "instructor"


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    username = (request.data.get("username") or "").strip().lower()
    academic_email = (request.data.get("academicEmail") or "").strip().lower()
    personal_email = (request.data.get("personalEmail") or "").strip().lower()
    password = request.data.get("password")

    if not username or not academic_email or not personal_email or not password:
        return Response(
            {"message": "username, academicEmail, personalEmail, and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {"message": "Username already taken"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 1. Verify Academic Email token presence
    academic_verification = (
        EmailVerification.objects.filter(academic_email=academic_email, is_verified=True)
        .order_by("-created_at")
        .first()
    )

    if not academic_verification:
        return Response(
            {"message": "Academic email is not verified. Please complete verification first."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 2. 🛠️ FIXED: Enforce checking validation token status for Personal Email step
    personal_verification = (
        EmailVerification.objects.filter(academic_email=personal_email, is_verified=True)
        .order_by("-created_at")
        .first()
    )

    if not personal_verification:
        return Response(
            {"message": "Personal email verification missing. Please confirm OTP session code first."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    uni_row = get_university_row_from_email(academic_email)
    if not uni_row:
        return Response(
            {"message": "Unsupported academic email domain"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    uni_page = uni_row.page
    role = resolve_role_from_domain(uni_row.domain)

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=personal_email,
                password=password,
            )

            UserProfile.objects.create(
                user=user,
                academic_email=academic_email,
            )

            if role == "student":
                Student.objects.create(user=user, university_page=uni_page)
            else:
                Instructor.objects.create(user=user, university_page=uni_page)

            # 🛠️ FIXED: Drop both temporary validation records cleanly
            academic_verification.delete()
            personal_verification.delete()

    except Exception as e:
        return Response(
            {"message": f"Signup failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "message": "Signup successful",
            "username": username,
            "email": academic_email,
        },
        status=status.HTTP_201_CREATED,
    )
