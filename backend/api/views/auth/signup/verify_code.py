from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.models import EmailVerification


@api_view(["POST"])
def verify_email(request):
    academic_email = (request.data.get("academicEmail") or "").strip().lower()
    code = (request.data.get("code") or "").strip()

    if not academic_email or not code:
        return Response({"message": "academicEmail and code are required"}, status=status.HTTP_400_BAD_REQUEST)
    v = (
        EmailVerification.objects.filter(academic_email=academic_email, is_verified=False)
        .order_by("-created_at")
        .first()
    )

    if not v:
        return Response(
            {"message": "No pending verification"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if v.is_expired():
        return Response(
            {"message": "expired verification, please resend"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if v.code != code:
        return Response(
            {"message": "invalid code"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    v.is_verified = True
    v.save(update_fields=["is_verified"])

    return Response(
        {"message": "Verification successful"},
        status=status.HTTP_200_OK,
    )
