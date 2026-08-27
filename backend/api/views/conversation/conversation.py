import json

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
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

from ...models import (
    Conversation,
    ConversationMember,
    Message,
    MessageMedia,
    MessageReaction,
)
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

    if member.left_at:
        query = query.filter(sent_at__lte=member.left_at)

    messages = (
        query.select_related(
            "sender__profile",
            "parent_message__sender",
            "shared_post",
        )
        .prefetch_related("media", "reactions__user__profile")
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

    # ── Poll message ──
    poll_question = request.data.get("poll_question", "").strip()
    poll_options_raw = request.data.getlist("poll_options")
    is_poll = bool(poll_question and len([o for o in poll_options_raw if o.strip()]) >= 2)

    if is_poll:
        opts = [o.strip() for o in poll_options_raw if o.strip()]
        poll_payload = {
            "_type": "poll",
            "question": poll_question,
            "options": [{"id": i, "text": t, "voter_ids": []} for i, t in enumerate(opts)],
        }
        text = json.dumps(poll_payload)

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

    is_forwarded = request.data.get("is_forwarded", False)

    msg = Message.objects.create(
        conversation_id=conversation_id,
        content=text if text else None,
        sender=user,
        parent_message=parent_message,
        is_forwarded=is_forwarded,
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

    # Broadcast to WS group so other members receive media messages in real-time
    try:
        avatar_url = None
        try:
            avatar = user.profile.profile_image
            if avatar:
                avatar_url = request.build_absolute_uri(avatar.url)
        except Exception:
            pass

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{conversation_id}",
            {
                "type": "chat_message",
                "message_id": msg.message_id,
                "conversation_id": int(conversation_id),
                "sender_id": user.id,
                "username": user.username,
                "avatar": avatar_url,
                "content": msg.content,
                "is_forwarded": msg.is_forwarded,
                "parent_message_id": parent_message.message_id if parent_message else None,
                "sent_at": msg.sent_at.isoformat(),
                "media": media_data_response,
            },
        )
    except Exception:
        pass  # WS broadcast is best-effort; REST response is authoritative

    return Response(
        {
            "id": msg.message_id,
            "text": msg.content,
            "is_forwarded": msg.is_forwarded,
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_message_reaction(request, message_id):
    """
    Toggles a 'like' reaction on a chat message.
    No body content is required from the frontend for now.
    """
    user = request.user
    message = get_object_or_404(Message, pk=message_id)

    reaction_type = "like"

    existing_reaction = MessageReaction.objects.filter(
        message=message, user=user, message_reaction_type=reaction_type
    ).first()

    if existing_reaction:
        existing_reaction.delete()
        return Response({"message": "Message unliked successfully.", "is_liked": False}, status=status.HTTP_200_OK)
    else:
        MessageReaction.objects.create(message=message, user=user, message_reaction_type=reaction_type)
        return Response({"message": "Message liked successfully.", "is_liked": True}, status=status.HTTP_201_CREATED)


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
    msg.is_edited = True
    msg.edited_at = timezone.now()

    msg.save()

    return Response(
        {
            "message": "Message edited successfully.",
            "id": msg.message_id,
            "text": msg.content,
            "time": msg.sent_at.strftime("%H:%M"),
            "is_edited": msg.is_edited,
            "edited_at": msg.edited_at,
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



def _get_avatar_url(request, user_obj):
    try:
        profile = getattr(user_obj, "profile", None)
        if profile and profile.profile_image:
            return request.build_absolute_uri(profile.profile_image.url)
    except Exception:
        pass
    return None


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def vote_message_poll(request, message_id):
    user = request.user
    msg = get_object_or_404(Message, message_id=message_id)

    try:
        poll = json.loads(msg.content or "")
        if poll.get("_type") != "poll":
            raise ValueError
    except (json.JSONDecodeError, ValueError):
        return Response({"error": "Not a poll message"}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "GET":
        uid = user.id
        all_voter_ids = set(v for o in poll["options"] for v in o["voter_ids"])
        voters = {u.id: u for u in User.objects.filter(id__in=all_voter_ids).select_related("profile")}
        total = sum(len(o["voter_ids"]) for o in poll["options"])
        result = []
        for opt in poll["options"]:
            count = len(opt["voter_ids"])
            avatars = [_get_avatar_url(request, voters[vid]) for vid in opt["voter_ids"][:3] if vid in voters]
            result.append({
                "id": opt["id"],
                "text": opt["text"],
                "votes_count": count,
                "percentage": round((count / total) * 100) if total else 0,
                "is_voted": uid in opt["voter_ids"],
                "voter_avatars": [a for a in avatars if a],
            })
        return Response({"question": poll["question"], "options": result}, status=status.HTTP_200_OK)

    option_id = request.data.get("option_id")
    if option_id is None:
        return Response({"error": "option_id required"}, status=status.HTTP_400_BAD_REQUEST)

    option_id = int(option_id)
    uid = user.id
    # Remove previous vote from all options
    for opt in poll["options"]:
        if uid in opt["voter_ids"]:
            opt["voter_ids"].remove(uid)

    # Toggle: add vote if not previously voted for this option
    for opt in poll["options"]:
        if opt["id"] == option_id and uid not in opt["voter_ids"]:
            opt["voter_ids"].append(uid)

    msg.content = json.dumps(poll)
    msg.save(update_fields=["content"])

    # Build response with voter avatars
    all_voter_ids = set(uid for o in poll["options"] for uid in o["voter_ids"])
    voters = {u.id: u for u in User.objects.filter(id__in=all_voter_ids).select_related("profile")}

    total = sum(len(o["voter_ids"]) for o in poll["options"])
    result = []
    for opt in poll["options"]:
        count = len(opt["voter_ids"])
        voter_avatars = [_get_avatar_url(request, voters[vid]) for vid in opt["voter_ids"][:3] if vid in voters]
        voter_avatars = [a for a in voter_avatars if a]
        result.append({
            "id": opt["id"],
            "text": opt["text"],
            "votes_count": count,
            "percentage": round((count / total) * 100) if total else 0,
            "is_voted": uid in opt["voter_ids"],
            "voter_avatars": voter_avatars,
        })

    return Response({"question": poll["question"], "options": result}, status=status.HTTP_200_OK)
