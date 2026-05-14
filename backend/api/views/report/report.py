from django.contrib.contenttypes.models import ContentType
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Report


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_report(request):
    data = request.data
    user = request.user

    selected_reason = data.get("reason", "Unknown")
    model_type_str = data.get("content_type", "").lower()
    target_object_id = data.get("reported_content_id")

    try:
        content_type_obj = ContentType.objects.get(model=model_type_str)
    except ContentType.DoesNotExist:
        return Response({"error": f"Invalid model type: {model_type_str}"}, status=400)

    full_reason_text = f"Category: {selected_reason}\nDetails: {data.get('extra_note', 'N/A')}"
    university_page = None
    if hasattr(user, "student_profile"):
        university_page = user.student_profile.university_page
    elif hasattr(user, "instructor_profile"):
        university_page = user.instructor_profile.university_page

    report = Report.objects.create(
        content_type_obj=content_type_obj,
        object_id=target_object_id,
        reporter=user,
        content_type=selected_reason,
        reason=full_reason_text,
        university_page=university_page,
    )

    return Response({"message": "Report submitted successfully", "report_id": report.report_id}, status=201)
