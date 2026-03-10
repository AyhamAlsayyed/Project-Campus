from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
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

    return UniversityDomain.objects.select_related("page").filter(domain=domain, is_active=True).first()


def resolve_role_from_domain(domain: str) -> str:
    return "student" if "students" in domain else "instructor"


@api_view(["POST"])
def signup(request):
    username = (request.data.get("username") or "").strip().lower()
    academic_email = (request.data.get("academicEmail") or "").strip().lower()
    personal_email = (request.data.get("personalEmail") or "").strip().lower()
    password = request.data.get("password")

    if User.objects.filter(username=username).exists():
        return Response(
            {"message": "Username already taken"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    print(academic_email)
    verification = (
        EmailVerification.objects.filter(academic_email=academic_email, is_verified=True)
        .order_by("-created_at")
        .first()
    )

    if not verification:
        return Response(
            {"message": "Academic email is not verified"},
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

        verification.delete()

    return Response(
        {"message": "Signup successful"},
        status=status.HTTP_201_CREATED,
    )
