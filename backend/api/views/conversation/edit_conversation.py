from django.contrib.auth import get_user_model
from rest_framework import status
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
def edit_group_details(request, conv_id):
    conv = _verify_edit_permission(request.user, conv_id)

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
def edit_group_image(request, conv_id):
    conv = _verify_edit_permission(request.user, conv_id)

    if "image" not in request.FILES:
        raise ValidationError("No image payload detected in request.")

    conv.image = request.FILES["image"]
    conv.save()

    image_url = request.build_absolute_uri(conv.image.url) if conv.image else ""
    return Response({"image": image_url})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_group_privacy_settings(request, conv_id):
    member = (
        ConversationMember.objects.select_related("conversation")
        .filter(conversation_id=conv_id, user=request.user)
        .first()
    )

    if not member:
        raise PermissionDenied("You are not a member of this group.")

    conv = member.conversation
    if not conv.is_group:
        return Response({"error": "This conversation is not a group."}, status=status.HTTP_400_BAD_REQUEST)

    is_privileged = (
        member.role in [ConversationMember.Role.ADMIN, ConversationMember.Role.OWNER] or conv.created_by == request.user
    )
    if not is_privileged:
        raise PermissionDenied("Only group administrators can modify conversation permission structures.")

    fields_to_update = [
        "allow_members_to_edit_settings",
        "allow_members_to_send_messages",
        "allow_members_to_add_others",
        "is_private",
    ]

    updated_fields = []
    for field in fields_to_update:
        if field in request.data:
            raw_value = request.data.get(field)
            if isinstance(raw_value, bool):
                val = raw_value
            else:
                val = str(raw_value).lower() in ["true", "1"]

            setattr(conv, field, val)
            updated_fields.append(field)
    if updated_fields:
        conv.save(update_fields=updated_fields)
    return Response(
        {
            "allow_members_to_edit_settings": conv.allow_members_to_edit_settings,
            "allow_members_to_send_messages": conv.allow_members_to_send_messages,
            "allow_members_to_add_others": conv.allow_members_to_add_others,
            "is_private": conv.is_private,
        },
        status=status.HTTP_200_OK,
    )
