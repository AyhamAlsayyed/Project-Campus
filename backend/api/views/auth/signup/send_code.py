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
    EmailVerification.objects.filter(expires_at__lt=timezone.now()).delete()

    username_input = (request.data.get("username") or "").strip()
    academic_email = (request.data.get("academicEmail") or "").strip().lower()
    personal_email = (request.data.get("personalEmail") or "").strip().lower()
    recovery_email = (request.data.get("recoveryEmail") or "").strip().lower()

    target_email = None

    is_authenticated = request.user and request.user.is_authenticated

    if not is_authenticated:
        if not academic_email or not username_input:
            return Response(
                {"message": "Both username and academicEmail are required for sign-up."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not re.fullmatch(r"[a-z]+", username_input):
            return Response(
                {"message": "Username must contain only lowercase letters"}, status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username__iexact=username_input).exists():
            return Response({"message": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

        if not is_valid_academic_email_domain(academic_email):
            return Response(
                {"message": "Academic email domain is invalid or not supported."}, status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email__iexact=academic_email).exists():
            return Response(
                {"message": "This academic email is already registered."}, status=status.HTTP_400_BAD_REQUEST
            )

        target_email = academic_email
        username_to_save = username_input

    else:
        username_to_save = request.user.username

        active_fields = [f for f in [academic_email, personal_email, recovery_email] if f]
        if len(active_fields) != 1:
            return Response(
                {"message": "Please pass exactly one targeted email field"}, status=status.HTTP_400_BAD_REQUEST
            )

        if academic_email:
            if not is_valid_academic_email_domain(academic_email):
                return Response(
                    {"message": "New academic email domain is invalid or not supported."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if User.objects.filter(email__iexact=academic_email).exclude(pk=request.user.pk).exists():
                return Response(
                    {"message": "This academic email is already in use by another user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            target_email = academic_email

        elif personal_email:
            if not is_valid_personal_email_format(personal_email):
                return Response({"message": "Personal email format is invalid."}, status=status.HTTP_400_BAD_REQUEST)

            target_email = personal_email

        elif recovery_email:
            if not is_valid_personal_email_format(recovery_email):
                return Response({"message": "Recovery email format is invalid."}, status=status.HTTP_400_BAD_REQUEST)

            target_email = recovery_email

    last_request = EmailVerification.objects.filter(academic_email=target_email).order_by("-created_at").first()

    if last_request and (timezone.now() - last_request.created_at).total_seconds() < 60:
        return Response(
            {"message": "Please wait before requesting another code."}, status=status.HTTP_429_TOO_MANY_REQUESTS
        )

    EmailVerification.objects.filter(academic_email=target_email, is_verified=False).delete()

    code = f"{random.randint(0, 999999):06d}"

    verification_entry = EmailVerification(username=username_to_save, academic_email=target_email, code=code)
    verification_entry.set_expiry(minutes=10)
    verification_entry.save()

    message_body = (
        "Welcome to Project Campus\n\n"
        "A verification request was initiated for your profile settings handler.\n"
        f"Your verification code is: {code}\n\n"
        "This security pin will completely expire in 10 minutes."
        " If you did not request this code, please safely ignore this communication.\n\n"
        "Best regards,\n"
        "The Project Campus Security Team"
    )

    try:
        send_mail(
            subject="ProjectCampus - Security Verification Code",
            message=message_body,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[str(target_email or "")],
            fail_silently=False,
        )
        return Response({"message": "Verification code sent successfully."}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"message": f"Failed to deliver verification code email via SMTP: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
