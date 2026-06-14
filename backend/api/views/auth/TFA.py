import random
import re

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import EmailVerification


def is_valid_email_format(email):
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_2fa_code(request):
    """
    Generates and sends a 2FA verification code to a user's alternate/secondary email.
    """
    # Clean up old expired verification codes across the system
    EmailVerification.objects.filter(expires_at__lt=timezone.now()).delete()

    secondary_email = (request.data.get("secondaryEmail") or "").strip().lower()
    username = request.user.username

    if not secondary_email:
        return Response({"message": "secondaryEmail is required"}, status=status.HTTP_400_BAD_REQUEST)

    if not is_valid_email_format(secondary_email):
        return Response({"message": "Invalid email format"}, status=status.HTTP_400_BAD_REQUEST)

    last = EmailVerification.objects.filter(academic_email=secondary_email).order_by("-created_at").first()

    if last and (timezone.now() - last.created_at).total_seconds() < 60:
        return Response(
            {"message": "Please wait 60 seconds before requesting another code."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    code = f"{random.randint(0, 999999):06d}"

    EmailVerification.objects.filter(academic_email=secondary_email, is_verified=False).delete()

    v = EmailVerification(username=username, academic_email=secondary_email, code=code)
    v.set_expiry(minutes=5)  # 2FA codes expire faster for tighter security (e.g., 5 minutes)
    v.save()

    try:
        send_mail(
            subject="ProjectCampus - Your 2FA Security Code",
            message=f"Security alert: Use verification code {code} to complete your action. "
            f"This code expires in 5 minutes.",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[secondary_email],
            fail_silently=False,
        )
        return Response({"message": "2FA verification code sent successfully"}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"message": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_2fa_code(request):
    """
    Confirms the 2FA code sent to the secondary email matches our records.
    """
    secondary_email = (request.data.get("secondaryEmail") or "").strip().lower()
    code = (request.data.get("code") or "").strip()

    if not secondary_email or not code:
        return Response({"message": "secondaryEmail and code are required"}, status=status.HTTP_400_BAD_REQUEST)

    v = (
        EmailVerification.objects.filter(
            username=request.user.username, academic_email=secondary_email, is_verified=False
        )
        .order_by("-created_at")
        .first()
    )

    if not v:
        return Response(
            {"message": "No pending 2FA verification found for this account request"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if v.is_expired():
        return Response(
            {"message": "2FA code has expired. Please request a new one."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if v.code != code:
        return Response(
            {"message": "Invalid security code. Please check your inbox and try again."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    v.is_verified = True
    v.save(update_fields=["is_verified"])

    return Response(
        {"message": "2FA verification verified successfully"},
        status=status.HTTP_200_OK,
    )
