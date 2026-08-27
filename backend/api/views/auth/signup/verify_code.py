from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
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

    should_send_notice = False
    notification_recipient = None
    changed_email_type = ""

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

                    notification_recipient = user.email or academic_email
                    changed_email_type = "Academic Email"
                    should_send_notice = True

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

                    notification_recipient = user.email or personal_email
                    changed_email_type = "Personal Email"
                    should_send_notice = True

                    user.email = personal_email
                    user.save(update_fields=["email"])

                elif recovery_email:
                    action_type = "verify_recovery"
                    if profile:
                        notification_recipient = user.email or profile.academic_email or recovery_email
                        changed_email_type = "Recovery Email"
                        should_send_notice = True

                        profile.recovery_email = recovery_email
                        profile.save(update_fields=["recovery_email"])
            else:
                if personal_email:
                    action_type = "verify_personal_signup"

    except Exception as db_error:
        return Response(
            {"message": f"Verification successful, but database save routine failed: {str(db_error)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if should_send_notice and notification_recipient:
        try:
            display_name = getattr(v, "username", "") or "User"
            message_body = (
                f"Hello {display_name},\n\n"
                f"This is an automated security notification to let you know that your {changed_email_type} "
                f"associated with Project Campus has been successfully changed/verified to: {target_email}.\n\n"
                f"If you did not make this change, please contact support immediately.\n\n"
                f"Best regards,\nProject Campus Team"
            )

            send_mail(
                subject=f"Security Notification: Your {changed_email_type} has been updated",
                message=message_body,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[str(notification_recipient or "")],
                fail_silently=False,
            )
        except Exception as email_err:
            print(f"Email delivery failed log trace: {email_err}")
            pass

    return Response(
        {
            "message": "Verification completed and records updated successfully.",
            "email": target_email,
            "action": action_type,
            "username": v.username,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def change_password(request):
    """
    Finalizes forgot-password flow. Validates that the email code was verified
    successfully, updates the password record, and consumes the token.
    """
    email = (request.data.get("email") or "").strip().lower()
    new_password = request.data.get("password") or ""

    if not email or not new_password:
        return Response(
            {"message": "Both email and new password are required fields."}, status=status.HTTP_400_BAD_REQUEST
        )

    v_token = EmailVerification.objects.filter(academic_email=email, is_verified=True).order_by("-created_at").first()

    if not v_token:
        return Response(
            {"message": "Security error: Email must be verified via code before changing password."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if v_token.is_expired():
        v_token.delete()
        return Response(
            {"message": "The verification session has timed out. Please request a new code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({"message": "User account recovery lookup failed."}, status=status.HTTP_404_NOT_FOUND)

    try:
        validate_password(new_password, user=user)
    except ValidationError as e:
        return Response({"message": e.messages}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            user.set_password(new_password)
            user.save(update_fields=["password"])
            EmailVerification.objects.filter(academic_email=email).delete()

    except Exception as db_err:
        return Response(
            {"message": f"Failed to save your new password configuration: {str(db_err)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        message_body = (
            f"Hello {user.username},\n\n"
            "This automated alert confirms your Project Campus account password was changed successfully.\n\n"
            "If you did not execute this action, please contact our system security response team immediately.\n\n"
            "Best regards,\nProject Campus Security Team"
        )
        send_mail(
            subject="Security Alert: Project Campus Password Changed",
            message=message_body,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass

    return Response({"message": "Password changed successfully! You can now log in."}, status=status.HTTP_200_OK)
