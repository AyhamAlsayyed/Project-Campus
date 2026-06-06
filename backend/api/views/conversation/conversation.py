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
    Friendship,
    Message,
    MessageMedia,
    Post,
)
from ...serializers import ConversationMemberSerializer, PostSerializer
from ...utils.blocked_users import is_blocked
from ...utils.feed import base_annotations
from ...utils.notifications import send_global_notification
from ...utils.user_type import get_user_avatar

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

    serializer = ConversationMemberSerializer(sorted_memberships, many=True, context={"request": request})

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
            "sender",
            "parent_message",
            "parent_message__sender",
            "sender__profile",
        )
        .prefetch_related("media")
        .order_by("sent_at")
    )

    data = []

    for msg in messages:
        if msg.sender:
            sender_name = msg.sender.username
            avatar = get_user_avatar(request, msg.sender)
            sender_id = "me" if msg.sender == user else msg.sender.id
        else:
            sender_name = "System"
            avatar = None
            sender_id = "system"

        reply_to = None
        if msg.parent_message:
            parent_sender_name = getattr(msg.parent_message.sender, "username", "Unknown User")

            reply_to = {
                "id": msg.parent_message.message_id,
                "text": msg.parent_message.content,
                "sender_name": parent_sender_name,
            }

        media_list = []
        for item in msg.media.all():
            file_url = None
            if item.media_file:
                file_url = request.build_absolute_uri(item.media_file.url)
            elif item.media_url:
                file_url = item.media_url

            media_list.append(
                {"id": item.media_id, "type": item.media_type, "url": file_url, "order_index": item.order_index}
            )

        message_data = {
            "id": msg.message_id,
            "text": msg.content,
            "type": "text" if not media_list else "media",
            "time": msg.sent_at.strftime("%H:%M"),
            "sender": sender_name,
            "senderId": sender_id,
            "avatar": avatar,
            "reply_to_details": reply_to,
            "media": media_list,
        }

        if msg.shared_post:
            annotated_post = (
                Post.objects.filter(post_id=msg.shared_post.post_id)
                .annotate(**base_annotations(user))
                .select_related("author__profile")
                .prefetch_related("media")
                .first()
            )

            if annotated_post:
                message_data["post"] = PostSerializer(annotated_post, context={"request": request}).data

        data.append(message_data)

    member.last_read_at = timezone.now()
    member.save(update_fields=["last_read_at"])

    return Response(data)


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

        ConversationMember.objects.create(
            conversation=new_group, user=user, role=ConversationMember.Role.OWNER
        )

        membership_objects = [
            ConversationMember(
                conversation=new_group, user=invited_user, role=ConversationMember.Role.MEMBER
            )
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
            is_privileged = (
                current_member_state.role in [ConversationMember.Role.ADMIN, ConversationMember.Role.OWNER]
                or conv.created_by == user
            )
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_dm(request, user_id):
    current_user = request.user
    target_user = get_object_or_404(User, id=user_id)
    existing = request.data.get("conversation_id")

    if existing:
        return Response({"id": existing})

    if is_blocked(current_user, target_user):
        raise PermissionDenied("You cannot start a chat context with this profile due to block restrictions.")

    profile = getattr(target_user, "profile", None)
    if not profile:
        return Response({"error": "User does not have an active profile."}, status=status.HTTP_400_BAD_REQUEST)

    privacy_setting = getattr(profile, "message_privacy", "EVERYONE")

    if privacy_setting == "NOBODY":
        raise PermissionDenied("This user does not allow new conversations.")

    elif privacy_setting == "FRIENDS_ONLY":
        is_target_a_page = hasattr(target_user, "page")

        if is_target_a_page:
            is_mutual = Friendship.objects.filter(
                user1=current_user,
                user2=target_user,
                status=Friendship.Status.FOLLOWING,
                relation_type=Friendship.RelationType.USER_TO_PAGE,
            ).exists()
        else:
            is_mutual = Friendship.objects.filter(
                (Q(user1=current_user, user2=target_user) | Q(user1=target_user, user2=current_user)),
                status=Friendship.Status.ACCEPTED,
                relation_type=Friendship.RelationType.USER_TO_USER,
            ).exists()

        if not is_mutual:
            raise PermissionDenied("You do not have permission to message this profile.")

    duplicate_dm = (
        Conversation.objects.filter(is_group=False, members__user=current_user)
        .filter(members__user=target_user)
        .first()
    )

    if duplicate_dm:
        return Response({"id": duplicate_dm.conversation_id}, status=status.HTTP_200_OK)

    new_conv = Conversation.objects.create(is_group=False, created_by=current_user)
    ConversationMember.objects.create(conversation=new_conv, user=current_user)
    ConversationMember.objects.create(conversation=new_conv, user=target_user)

    send_global_notification(
        sender=current_user,
        receiver=target_user,
        notification_type="dm-request",
        target_object=new_conv,
        custom_text=f"{current_user.username} wants to start a conversation with you.",
    )
    return Response({"id": new_conv.conversation_id}, status=status.HTTP_201_CREATED)
