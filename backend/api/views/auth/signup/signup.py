from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ....models import EmailVerification, UserProfile

User = get_user_model()


@api_view(["POST"])
def signup(request):
    username = (request.data.get("username") or "").strip()
    academic_email = (request.data.get("academicEmail") or "").strip().lower()
    personal_email = (request.data.get("personalEmail") or "").strip().lower()
    password = request.data.get("password")

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

    user = User.objects.create_user(
        username=username,
        email=personal_email,
        password=password,
    )

    UserProfile.objects.create(
        user=user,
        academic_email=academic_email,
    )

    verification.delete()

    return Response(
        {"message": "Signup successful"},
        status=status.HTTP_201_CREATED,
    )
