from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Conversation, ConversationMember, Message, MessageMedia
from ...serializers import ConversationSerializer, MessageSerializer
from ...utils.blocked_users import is_blocked
from ...utils.conversation import get_or_create_direct_conversation

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    user = request.user

    memberships = (
        ConversationMember.objects.filter(user=user)
        .filter(Q(conversation__status="accepted") | Q(conversation__created_by=user))
        .select_related("conversation", "conversation__last_message", "conversation__created_by")
        .prefetch_related("conversation__members__user__profile")
    )

    sorted_memberships = sorted(
        memberships,
        key=lambda m: (
            m.conversation.last_message.sent_at if m.conversation.last_message else m.conversation.created_at
        ),
        reverse=True,
    )

    serializer = ConversationSerializer(sorted_memberships, many=True, context={"request": request})

    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
    user = request.user

    member = get_object_or_404(
        ConversationMember,
        conversation_id=conversation_id,
        user=user,
    )

    query = Message.objects.filter(conversation_id=conversation_id)

    if member.cleared_at:
        query = query.filter(sent_at__gt=member.cleared_at)

    messages = (
        query.select_related(
            "sender__profile",
            "parent_message__sender",
            "shared_post",
        )
        .prefetch_related("media")
        .order_by("sent_at")
    )

    serializer = MessageSerializer(messages, many=True, context={"request": request})

    member.last_read_at = timezone.now()
    member.save(update_fields=["last_read_at"])

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_group_conversation(request):
    user = request.user

    name = request.data.get("name", "").strip()
    description = request.data.get("description", "").strip()
    is_private = request.data.get("is_private", False)
    is_academic = request.data.get("is_academic", False)
    group_image = request.FILES.get("image")

    member_ids = request.data.get("members", [])

    if not name:
        return Response({"error": "Group name is required."}, status=status.HTTP_400_BAD_REQUEST)

    if isinstance(member_ids, str):
        try:
            import json

            member_ids = json.loads(member_ids)
        except ValueError:
            return Response({"error": "Members field must be a valid list."}, status=status.HTTP_400_BAD_REQUEST)

    if not isinstance(member_ids, list) or len(member_ids) == 0:
        return Response(
            {"error": "At least one initial member is required to create a group chat."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cleaned_member_ids = list(set(int(m_id) for m_id in member_ids if int(m_id) != user.id))

    if not cleaned_member_ids:
        return Response(
            {"error": "You cannot create a group containing only yourself."}, status=status.HTTP_400_BAD_REQUEST
        )

    invited_users = User.objects.filter(id__in=cleaned_member_ids)

    if not invited_users.exists():
        return Response({"error": "No valid initial members found."}, status=status.HTTP_404_NOT_FOUND)

    if is_academic:
        is_instructor = hasattr(user, "instructor_profile") and user.instructor_profile is not None
        if not is_instructor:
            raise PermissionDenied("Only instructors can create academic groups.")

    with transaction.atomic():
        new_group = Conversation.objects.create(
            name=name,
            description=description if description else None,
            image=group_image,
            is_group=True,
            is_private=is_private,
            is_academic=is_academic,
            status=Conversation.Status.ACCEPTED,
            created_by=user,
        )

        ConversationMember.objects.create(conversation=new_group, user=user, role=ConversationMember.Role.ADMIN)

        membership_objects = [
            ConversationMember(conversation=new_group, user=invited_user, role=ConversationMember.Role.MEMBER)
            for invited_user in invited_users
        ]

        ConversationMember.objects.bulk_create(membership_objects)

    return Response(
        {
            "message": "Group created successfully.",
            "conversation_id": new_group.conversation_id,
            "name": new_group.name,
            "is_academic": new_group.is_academic,
            "status": new_group.status,
            "members_added": invited_users.count(),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    user = request.user
    text = request.data.get("text", "").strip()
    reply_to_id = request.data.get("reply_to")
    parent_message = None

    uploaded_files = request.FILES.getlist("images")

    if not text and not uploaded_files:
        return Response({"error": "Cannot send an empty message"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        current_member_state = ConversationMember.objects.select_related("conversation").get(
            conversation_id=conversation_id, user=user
        )
    except ConversationMember.DoesNotExist:
        return Response({"error": "You are not a member!"}, status=status.HTTP_403_FORBIDDEN)

    conv = current_member_state.conversation

    if conv.is_group:
        if not conv.allow_members_to_send_messages:
            is_privileged = current_member_state.role == ConversationMember.Role.ADMIN
            if not is_privileged:
                raise PermissionDenied("Only administrators can send messages to this group right now.")
    else:
        other_member = conv.members.exclude(user=user).first()
        if other_member and other_member.user:
            if is_blocked(user, other_member.user):
                raise PermissionDenied("You aer blocked.")

    if reply_to_id:
        try:
            parent_message = Message.objects.get(message_id=reply_to_id)
        except Message.DoesNotExist:
            parent_message = None

    msg = Message.objects.create(
        conversation_id=conversation_id,
        content=text if text else None,
        sender=user,
        parent_message=parent_message,
    )

    media_data_response = []
    media_index = 0

    for file_obj in uploaded_files:
        content_type = getattr(file_obj, "content_type", "")
        media_type = MessageMedia.MediaType.FILE

        if content_type.startswith("image/"):
            media_type = MessageMedia.MediaType.IMAGE
        elif content_type.startswith("video/"):
            media_type = MessageMedia.MediaType.VIDEO
        elif content_type.startswith("audio/"):
            media_type = MessageMedia.MediaType.AUDIO

        media_instance = MessageMedia.objects.create(
            message=msg, media_type=media_type, media_file=file_obj, order_index=media_index
        )

        media_data_response.append(
            {
                "id": media_instance.media_id,
                "type": media_instance.media_type,
                "url": request.build_absolute_uri(media_instance.media_file.url),
                "order_index": media_index,
            }
        )
        media_index += 1

    conv.last_message = msg
    conv.save(update_fields=["last_message"])

    return Response(
        {
            "id": msg.message_id,
            "text": msg.content,
            "type": "text" if not media_data_response else "media",
            "time": msg.sent_at.strftime("%H:%M"),
            "senderId": "me",
            "media": media_data_response,
            "reply_to_details": (
                {
                    "id": parent_message.message_id,
                    "text": parent_message.content,
                    "sender_name": parent_message.sender.username if parent_message.sender else "Unknown",
                }
                if parent_message
                else None
            ),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    user = request.user

    msg = get_object_or_404(Message.objects.select_related("conversation"), message_id=message_id)
    conv = msg.conversation

    try:
        membership = ConversationMember.objects.get(conversation=conv, user=user)
    except ConversationMember.DoesNotExist:
        return Response({"error": "You are not part of this conversation."}, status=status.HTTP_403_FORBIDDEN)

    is_sender = msg.sender == user
    is_admin = conv.is_group and membership.role == ConversationMember.Role.ADMIN

    if not (is_sender or is_admin):
        raise PermissionDenied("You do not have permission to delete this message.")

    with transaction.atomic():
        if conv.last_message == msg:
            previous_msg = (
                Message.objects.filter(conversation=conv).exclude(message_id=message_id).order_by("-sent_at").first()
            )
            conv.last_message = previous_msg
            conv.save(update_fields=["last_message"])

        msg.delete()

    return Response({"message": "Message deleted successfully for everyone."}, status=status.HTTP_200_OK)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def edit_message(request, message_id):
    user = request.user
    new_text = request.data.get("text", "").strip()
    msg = get_object_or_404(Message.objects.prefetch_related("media"), message_id=message_id)

    if msg.sender != user:
        raise PermissionDenied("You cannot edit a message sent by another user.")

    has_media = msg.media.exists()
    if not new_text and not has_media:
        return Response({"error": "Cannot edit message to be completely empty."}, status=status.HTTP_400_BAD_REQUEST)

    msg.content = new_text
    msg.save(update_fields=["content"])

    return Response(
        {
            "message": "Message edited successfully.",
            "id": msg.message_id,
            "text": msg.content,
            "time": msg.sent_at.strftime("%H:%M"),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_dm(request, user_id):
    current_user = request.user

    existing_id = request.data.get("conversation_id")
    if existing_id:
        return Response({"id": existing_id}, status=status.HTTP_200_OK)

    target_user = get_object_or_404(User, id=user_id)

    conversation, created = get_or_create_direct_conversation(current_user, target_user)

    response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return Response({"id": conversation.conversation_id}, status=response_status)
