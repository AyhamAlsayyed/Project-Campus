from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Page, Post, Report
from ...serializers import (
    CommentSerializer,
    CommunitySerializer,
    EventSerializer,
    MessageSerializer,
    PageSerializer,
    PostSerializer,
    UserProfileSerializer,
)
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
    selected_reason = data.get("reason", "").lower().strip()
    model_type_str = data.get("content_type", "").lower().strip()
    target_object_id = data.get("reported_content_id")
    details = data.get("details", "").strip()

    valid_reasons = [choice[0] for choice in Report.ContentType.choices]
    if selected_reason not in valid_reasons:
        return Response(
            {"error": f"Invalid reason. Must be one of: {', '.join(valid_reasons)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        content_type_obj = ContentType.objects.get(model=model_type_str)
    except ContentType.DoesNotExist:
        return Response(
            {
                "error": f"Invalid content type '{model_type_str}'. Supported types: "
                f"post, comment, message, community, page, userprofile, event."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    model_class = content_type_obj.model_class()
    if not model_class:
        return Response({"error": "Content type model class not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        target_content = model_class.objects.get(pk=target_object_id)
    except model_class.DoesNotExist:
        return Response(
            {"error": f"{model_type_str.capitalize()} with ID {target_object_id} does not exist."},
            status=status.HTTP_404_NOT_FOUND,
        )

    university_page = None

    # author, sender, owner only one will not be None based on the content of the reported thing
    author = getattr(target_content, "author", None)  # if it's a post etc . .
    sender = getattr(target_content, "sender", None)  # if it's a message etc . .
    owner = getattr(target_content, "owner", None)  # if it's a community . .
    target_user = getattr(target_content, "user", None)

    content_owner = author or sender or owner or target_user

    if content_owner:
        university_page = get_user_university(content_owner)
    elif isinstance(target_content, Page) and target_content.page_type == Page.PageType.UNIVERSITY:
        # If the university page itself is reported, route it globally or to itself
        university_page = target_content

    report = Report.objects.create(
        content_type_obj=content_type_obj,
        object_id=target_object_id,
        reporter=user,
        content_type=selected_reason,
        reason=details if details else f"Reported for: {selected_reason.replace('_', ' ').title()}",
        university_page=university_page,
    )

    response_data = {
        "message": "Report submitted successfully",
        "report_id": report.report_id,
        "status": "pending",
        "reported_type": model_type_str,
    }

    serializer_mapping = {
        "post": (PostSerializer, getattr(target_content, "post_id", None)),
        "comment": (CommentSerializer, getattr(target_content, "comment_id", None)),
        "message": (MessageSerializer, getattr(target_content, "message_id", None)),
        "community": (CommunitySerializer, getattr(target_content, "community_id", None)),
        "page": (PageSerializer, getattr(target_content, "id", None)),
        "userprofile": (UserProfileSerializer, getattr(target_content, "id", None)),
        "event": (EventSerializer, getattr(target_content, "event_id", None)),
    }

    if model_type_str in serializer_mapping:
        serializer_class, _ = serializer_mapping[model_type_str]
        if model_type_str == "post" and hasattr(Post.objects, "annotate"):
            annotated_post = (
                Post.objects.filter(post_id=target_object_id)
                .annotate(**base_annotations(user))
                .select_related("author__profile", "author__page")
                .prefetch_related("media")
                .first()
            )
            if annotated_post:
                target_content = annotated_post

        serializer_context = {"request": request}
        response_data["reported_content"] = serializer_class(target_content, context=serializer_context).data

    return Response(response_data, status=status.HTTP_201_CREATED)
