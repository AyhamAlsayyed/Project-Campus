from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import ConversationMember

User = get_user_model()


def _verify_edit_permission(user, conversation_id):
    member = ConversationMember.objects.filter(conversation_id=conversation_id, user=user).first()
    if not member:
        raise PermissionDenied("Not a member of this group.")

    conv = member.conversation
    is_privileged = getattr(member, "is_admin", False) or (conv.created_by == user)

    if not conv.allow_members_to_edit_settings and not is_privileged:
        raise PermissionDenied("Only administrators can modify group information.")
    return conv


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def edit_group_details(request, conversation_id):
    conv = _verify_edit_permission(request.user, conversation_id)

    name = request.data.get("name")
    description = request.data.get("description")

    if name is not None:
        conv.name = name
    if description is not None:
        conv.description = description

    conv.save()
    return Response({"name": conv.name, "description": conv.description})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def edit_group_image(request, conversation_id):
    conv = _verify_edit_permission(request.user, conversation_id)

    if "image" not in request.FILES:
        raise ValidationError("No image payload detected in request.")

    conv.image = request.FILES["image"]
    conv.save()

    image_url = request.build_absolute_uri(conv.image.url) if conv.image else ""
    return Response({"image": image_url})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_group_privacy_settings(request, conversation_id):
    member = ConversationMember.objects.filter(conversation_id=conversation_id, user=request.user).first()
    if not member:
        raise PermissionDenied("Access denied.")

    conv = member.conversation
    is_privileged = getattr(member, "is_admin", False) or (conv.created_by == request.user)
    if not is_privileged:
        raise PermissionDenied("Only group administrators can modify systemic permission structures.")

    # Selectively pop parameters from data payload if included
    fields_to_update = [
        "allow_members_to_edit_settings",
        "allow_members_to_send_messages",
        "allow_members_to_add_others",
        "is_private",
    ]

    for field in fields_to_update:
        if field in request.data:
            # Coerce value input to explicit Boolean type evaluation
            setattr(conv, field, str(request.data.get(field)).lower() in ["true", "1"])

    conv.save()
    return Response(
        {
            "allow_members_to_edit_settings": conv.allow_members_to_edit_settings,
            "allow_members_to_send_messages": conv.allow_members_to_send_messages,
            "allow_members_to_add_others": conv.allow_members_to_add_others,
            "is_private": conv.is_private,
        }
    )
