import random
import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ....models import EmailVerification, UniversityDomain


def is_valid_academic_email_domain(email):
    email = (email or "").strip().lower()
    if "@" not in email:
        return False
    domain = email.split("@", 1)[1]
    return UniversityDomain.objects.filter(domain=domain, is_active=True).exists()


def is_valid_personal_email_format(email):
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def send_code(request):
    # delete the expired EmailVerification if any
    EmailVerification.objects.filter(expires_at__lt=timezone.now()).delete()

    username = (request.data.get("username") or "").strip()
    academic_email = (request.data.get("academicEmail") or "").strip().lower()
    personal_email = (request.data.get("personalEmail") or "").strip().lower()

    target_email = academic_email or personal_email
    is_academic = bool(academic_email)

    if not target_email:
        return Response(
            {"message": "academicEmail or personalEmail are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not username and academic_email:
        return Response(
            {"message": "username is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if is_academic:
        if not re.fullmatch(r"[a-z]+", username):
            return Response(
                {"message": "Username must contain only lowercase letters"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Enforce username uniqueness
        if User.objects.filter(username__iexact=username).exists():
            return Response({"message": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

        if not is_valid_academic_email_domain(target_email):
            return Response(
                {"message": "academicEmail is invalid or domain not supported"}, status=status.HTTP_400_BAD_REQUEST
            )
    else:
        if not is_valid_personal_email_format(target_email):
            return Response({"message": "personalEmail format is invalid"}, status=status.HTTP_400_BAD_REQUEST)

    last = EmailVerification.objects.filter(academic_email=target_email).order_by("-created_at").first()

    if last and (timezone.now() - last.created_at).total_seconds() < 60:
        return Response({"message": "Please wait!!"}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    code = f"{random.randint(0, 999999):06d}"

    # remove old pending codes
    EmailVerification.objects.filter(academic_email=target_email, is_verified=False).delete()

    v = EmailVerification(username=username, academic_email=target_email, code=code)
    v.set_expiry(minutes=10)
    v.save()

    try:
        send_mail(
            subject="ProjectCampus - verification code",
            message=f"Welcome to Project Campus! Your verification code is: {code}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[target_email],
            fail_silently=False,
        )
        return Response({"message": "Verification code sent"}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"message": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
