from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ....models import EmailVerification, Page, UniversityDomain


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_code(request):
    academic_email = (request.data.get("academicEmail") or "").strip().lower()
    personal_email = (request.data.get("personalEmail") or "").strip().lower()
    recovery_email = (request.data.get("recoveryEmail") or "").strip().lower()
    code = (request.data.get("code") or "").strip()

    target_email = academic_email or personal_email or recovery_email

    if not target_email or not code:
        return Response(
            {"message": "Target email and verification code are required."}, status=status.HTTP_400_BAD_REQUEST
        )

    v = EmailVerification.objects.filter(academic_email=target_email, is_verified=False).order_by("-created_at").first()

    if not v:
        return Response(
            {"message": "No pending verification found for this email address."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if v.is_expired():
        return Response(
            {"message": "This verification code has expired. Please request a new one."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if v.code != code:
        return Response(
            {"message": "Invalid verification code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    action_type = "signup"
    user = request.user

    try:
        with transaction.atomic():
            v.is_verified = True
            v.save(update_fields=["is_verified"])

            if user and user.is_authenticated:
                profile = getattr(user, "profile", None)

                if academic_email:
                    action_type = "change_academic"
                    if profile:
                        profile.academic_email = academic_email
                        profile.save(update_fields=["academic_email"])

                    domain_str = academic_email.split("@", 1)[1]
                    domain_obj = UniversityDomain.objects.filter(domain=domain_str, is_active=True).first()

                    target_uni_page = None
                    if domain_obj and hasattr(domain_obj, "university_page"):
                        target_uni_page = domain_obj.university_page
                    elif domain_obj:
                        target_uni_page = Page.objects.filter(name__iexact=domain_obj.name).first()

                    student_profile = getattr(user, "student_profile", None)
                    instructor_profile = getattr(user, "instructor_profile", None)

                    if student_profile:
                        student_profile.university_page = target_uni_page
                        student_profile.save(update_fields=["university_page"])

                    if instructor_profile:
                        instructor_profile.university_page = target_uni_page
                        instructor_profile.save(update_fields=["university_page"])

                elif personal_email:
                    action_type = "verify_personal"
                    user.email = personal_email
                    user.save(update_fields=["email"])

                elif recovery_email:
                    action_type = "verify_recovery"
                    if profile:
                        profile.recovery_email = recovery_email
                        profile.save(update_fields=["recovery_email"])

    except Exception as db_error:
        return Response(
            {"message": f"Verification successful, but database save routine failed: {str(db_error)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "message": "Verification completed and records updated successfully.",
            "email": target_email,
            "action": action_type,
            "username": v.username,
        },
        status=status.HTTP_200_OK,
    )
