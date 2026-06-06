from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Case, IntegerField, Q, Value, When
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import ConversationMember, Friendship
from ...serializers import GroupMemberSerializer, UserMinimalSerializer

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_friends_to_invite(request, conv_id=None):
    user = request.user

    if conv_id:
        existing_member_ids = ConversationMember.objects.filter(conversation_id=conv_id).values_list(
            "user_id", flat=True
        )
    else:
        existing_member_ids = []

    friendships = Friendship.objects.filter(
        Q(user1=user) | Q(user2=user),
        status=Friendship.Status.ACCEPTED,
        relation_type=Friendship.RelationType.USER_TO_USER,
    )

    friend_ids = []
    for f in friendships:
        if f.user1_id == user.id:
            friend_ids.append(f.user2_id)
        else:
            friend_ids.append(f.user1_id)

    invitable_users = (
        User.objects.filter(id__in=friend_ids).exclude(id__in=existing_member_ids).select_related("profile")
    )

    serializer = UserMinimalSerializer(invitable_users, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_member_to_group(request, conv_id):
    user = request.user
    target_user_id = request.data.get("user_id")

    if not conv_id or not target_user_id:
        raise ValidationError({"detail": "Both conversation_id and user_id are required."})

    try:
        current_member_state = ConversationMember.objects.select_related("conversation").get(
            conversation_id=conv_id, user=user
        )
    except ConversationMember.DoesNotExist:
        raise PermissionDenied("You are not a member of this conversation.")

    conv = current_member_state.conversation

    if not conv.is_group:
        raise ValidationError({"detail": "Cannot add members to a private direct message conversation."})

    is_privileged = (
        current_member_state.role in [ConversationMember.Role.ADMIN, ConversationMember.Role.OWNER]
        or conv.created_by == user
        or not conv.is_private
    )

    if not is_privileged:
        raise PermissionDenied("Only administrators can add new members to this group.")

    target_user = get_object_or_404(User, id=target_user_id)

    if ConversationMember.objects.filter(conversation=conv, user=target_user).exists():
        raise ValidationError({"detail": f"{target_user.username} is already a member of this group."})

    try:
        ConversationMember.objects.create(conversation=conv, user=target_user, role=ConversationMember.Role.MEMBER)
    except DjangoValidationError as e:
        raise ValidationError({"detail": e.messages})

    return Response(
        {"detail": f"{target_user.username} successfully added to the group."}, status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_group_members(request, conv_id):
    if not ConversationMember.objects.filter(conversation_id=conv_id, user=request.user).exists():
        raise PermissionDenied("You cannot view members of a group you aren't part of.")

    members = ConversationMember.objects.filter(conversation_id=conv_id).select_related(
        "user",
        "user__profile",
        "user__student_profile",
        "user__instructor_profile",
        "user__admin_profile",
    )

    if not members.exists():
        return Response([])

    ordered_memberships = members.annotate(
        role_priority=Case(
            When(role=ConversationMember.Role.OWNER, then=Value(3)),
            When(role=ConversationMember.Role.ADMIN, then=Value(2)),
            When(role=ConversationMember.Role.MEMBER, then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        )
    ).order_by("-role_priority", "user__username")

    sorted_users = []
    for membership in ordered_memberships:
        user_obj = membership.user
        if user_obj:
            user_obj.stashed_group_role = membership.role
            sorted_users.append(user_obj)

    serializer = GroupMemberSerializer(sorted_users, many=True, context={"request": request})
    return Response(serializer.data)
