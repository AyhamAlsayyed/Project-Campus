from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import ConversationMember


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_group_admin(request, conv_id):
    current_user = request.user
    target_member_id = request.data.get("member_id")

    if not target_member_id:
        return Response({"error": "member_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    request_sender_membership = get_object_or_404(
        ConversationMember.objects.select_related("conversation"), conversation_id=conv_id, user=current_user
    )

    conv = request_sender_membership.conversation
    if not conv.is_group:
        return Response(
            {"error": "This action is only valid for group conversations."}, status=status.HTTP_400_BAD_REQUEST
        )

    if request_sender_membership.role not in [ConversationMember.Role.OWNER, ConversationMember.Role.ADMIN]:
        raise PermissionDenied("You do not have permission to manage roles in this group.")

    target_membership = get_object_or_404(ConversationMember, conversation_id=conv_id, user_id=target_member_id)

    if target_membership.role == ConversationMember.Role.OWNER:
        return Response({"error": "The group owner's role cannot be modified."}, status=status.HTTP_400_BAD_REQUEST)

    if target_membership.role == ConversationMember.Role.ADMIN:
        if request_sender_membership.role != ConversationMember.Role.OWNER:
            raise PermissionDenied("Only the group owner can demote an administrator.")

        target_membership.role = ConversationMember.Role.MEMBER
        target_membership.save(update_fields=["role"])
        return Response(
            {"message": "Successfully demoted administrator to regular group member."},
            status=status.HTTP_200_OK,
        )

    target_membership.role = ConversationMember.Role.ADMIN
    target_membership.save(update_fields=["role"])

    return Response(
        {"message": "Successfully promoted user to group administrator.", "current_role": "admin"},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_member_from_group(request, conv_id):
    current_user = request.user
    target_member_id = request.data.get("member_id")

    if not target_member_id:
        return Response({"error": "member_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    if int(target_member_id) == current_user.id:
        return Response({"error": "You cannot kick yourself."}, status=status.HTTP_400_BAD_REQUEST)

    request_sender_membership = get_object_or_404(
        ConversationMember.objects.select_related("conversation"), conversation_id=conv_id, user=current_user
    )

    if not request_sender_membership.conversation.is_group:
        return Response({"error": "This action is only valid for group's."}, status=status.HTTP_400_BAD_REQUEST)

    if request_sender_membership.role not in [ConversationMember.Role.OWNER, ConversationMember.Role.ADMIN]:
        raise PermissionDenied("You do not have permission to remove members.")

    target_membership = get_object_or_404(ConversationMember, conversation_id=conv_id, user_id=target_member_id)

    if target_membership.role == ConversationMember.Role.OWNER:
        raise PermissionDenied("The group owner cannot be removed from the group.")

    if (
        request_sender_membership.role == ConversationMember.Role.ADMIN
        and target_membership.role == ConversationMember.Role.ADMIN
    ):
        raise PermissionDenied("Only the owner can remove other admin's.")

    target_membership.delete()

    return Response(
        {"message": "Member was successfully removed from the group conversation."}, status=status.HTTP_200_OK
    )
