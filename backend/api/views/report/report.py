from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Post, Report
from ...serializers import PostSerializer
from ...utils.feed import base_annotations
from ...utils.uni_page import get_user_university


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_report(request):
    """
    {
        "content_type": "",
        "reported_content_id": ,
        "reason": "",
        "details": ""
    }
    """
    data = request.data
    user = request.user
    selected_reason = data.get("reason", "").lower()
    model_type_str = data.get("content_type", "").lower()
    target_object_id = data.get("reported_content_id")
    details = data.get("details", "")

    valid_reasons = [choice[0] for choice in Report.ContentType.choices]
    if selected_reason not in valid_reasons:
        return Response(
            {"error": f"Invalid reason. Must be one of: {', '.join(valid_reasons)}"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        content_type_obj = ContentType.objects.get(model=model_type_str)
    except ContentType.DoesNotExist:
        return Response(
            {"error": f"Invalid content type: {model_type_str}. Must be: post, comment, message, etc."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        model_class = content_type_obj.model_class()
        if not model_class:
            return Response({"error": "Content type model not found"}, status=status.HTTP_404_NOT_FOUND)

        target_content = model_class.objects.get(pk=target_object_id)
    except model_class.DoesNotExist:
        return Response(
            {"error": f"{model_type_str} with id {target_object_id} not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({"error": f"Error retrieving content: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    university_page = None

    author = getattr(target_content, "author", None)
    if author:
        university_page = get_user_university(author)

    elif hasattr(target_content, "sender"):
        sender = getattr(target_content, "sender", None)
        if sender:
            university_page = get_user_university(sender)

    report = Report.objects.create(
        content_type_obj=content_type_obj,
        object_id=target_object_id,
        reporter=user,
        content_type=selected_reason,
        reason=details if details else f"Reported for: {selected_reason}",
        university_page=university_page,
    )

    response_data = {"message": "Report submitted successfully", "report_id": report.report_id, "status": "pending"}

    if model_type_str == "post":
        post = (
            Post.objects.filter(post_id=target_object_id)
            .annotate(**base_annotations(user))
            .select_related("author__profile", "author__page")
            .prefetch_related("media")
            .first()
        )

        if post:
            response_data["reported_content"] = PostSerializer(post, context={"request": request}).data

    return Response(response_data, status=status.HTTP_201_CREATED)
