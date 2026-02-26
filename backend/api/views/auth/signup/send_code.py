import random

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ....models import EmailVerification

# if we want to add another uni we can just add the domain here:
ALLOWED_DOMAINS = ["students.ptuk.edu.ps"]


def is_valid_academic_email_domain(email):
    email = (email or "").strip().lower()
    if "@" not in email:
        return False
    domain = email.split("@", 1)[1]
    return domain in ALLOWED_DOMAINS


User = get_user_model()


@api_view(["POST"])
def send_code(request):
    EmailVerification.objects.filter(expires_at__lt=timezone.now()).delete()

    username = (request.data.get("username") or "").strip()
    academic_email = (request.data.get("academicEmail") or "").strip().lower()

    if not username or not academic_email:
        return Response({"message": "username and academicEmail  are required"}, status=status.HTTP_400_BAD_REQUEST)

    # Enforce username uniqueness
    # (ayham: do we want it to be case sensitive?)
    if User.objects.filter(username__iexact=username).exists():
        return Response({"message": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

    # Enform domain
    if not is_valid_academic_email_domain(academic_email):
        return Response({"message": "academicEmail is invalid"}, status=status.HTTP_400_BAD_REQUEST)

    # prevent spam
    last = EmailVerification.objects.filter(academic_email=academic_email).order_by("-created_at").first()

    if last and (timezone.now() - last.created_at).total_seconds() < 60:
        return Response({"message": "Please wait!!"}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    code = f"{random.randint(0, 999999):06d}"

    # remove old pending codes
    EmailVerification.objects.filter(academic_email=academic_email, is_verified=False).delete()

    v = EmailVerification(username=username, academic_email=academic_email, code=code)
    v.set_expiry(minutes=10)
    v.save()

    # the email will be just printed for testing
    print(f"[send-code] academic_email: {academic_email} code: {code}")
    send_mail(
        subject="Your PTUK verification code",
        message=f"Your verification code is: {code}",
        from_email=None,
        recipient_list=[academic_email],
        fail_silently=False,
    )

    return Response({"message": "Verification code sent"}, status=status.HTTP_200_OK)
