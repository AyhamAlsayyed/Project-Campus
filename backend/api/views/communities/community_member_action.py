from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import CommunityMember
from ...serializers import CommunityMemberSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_community_members(request, community_id):
    requester_membership = CommunityMember.objects.filter(
        community_id=community_id, user=request.user, status=CommunityMember.Status.APPROVED
    ).exists()

    if not requester_membership:
        raise PermissionDenied("You must be an approved member to view this community list.")

    memberships = CommunityMember.objects.filter(
        community_id=community_id, status=CommunityMember.Status.APPROVED
    ).select_related("user")

    serializer = CommunityMemberSerializer(memberships, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_community_admin(request, community_id, member_id):
    requester = get_object_or_404(CommunityMember, community_id=community_id, user=request.user)

    if requester.role not in [CommunityMember.Role.OWNER, CommunityMember.Role.ADMIN]:
        raise PermissionDenied("You do not have administrative permissions in this community.")

    target_member = get_object_or_404(CommunityMember, community_id=community_id, user_id=member_id)

    if target_member.role == CommunityMember.Role.OWNER:
        return Response({"error": "The community owner cannot be modified."}, status=status.HTTP_400_BAD_REQUEST)

    if target_member.role == CommunityMember.Role.ADMIN:
        if requester.role != CommunityMember.Role.OWNER:
            raise PermissionDenied("Only the community owner can demote an administrator.")

        target_member.role = CommunityMember.Role.MEMBER
        target_member.save(update_fields=["role"])
        return Response(
            {"message": "Successfully demoted admin to regular member.", "role": "member"}, status=status.HTTP_200_OK
        )

    target_member.role = CommunityMember.Role.ADMIN
    target_member.save(update_fields=["role"])
    return Response({"message": "Successfully promoted member to admin.", "role": "admin"}, status=status.HTTP_200_OK)


@api_view(["DELETE", "POST"])
@permission_classes([IsAuthenticated])
def kick_community_member(request, community_id, member_id):
    if int(member_id) == request.user.id:
        return Response(
            {"error": "You cannot kick yourself. Use a leave channel mechanism instead."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    requester = get_object_or_404(CommunityMember, community_id=community_id, user=request.user)

    if requester.role not in [CommunityMember.Role.OWNER, CommunityMember.Role.ADMIN]:
        raise PermissionDenied("You do not have administrative power to kick members.")

    target_member = get_object_or_404(CommunityMember, community_id=community_id, user_id=member_id)

    if target_member.role == CommunityMember.Role.OWNER:
        raise PermissionDenied("The community owner cannot be kicked.")

    if requester.role == CommunityMember.Role.ADMIN and target_member.role == CommunityMember.Role.ADMIN:
        raise PermissionDenied("Administrators cannot kick other administrators. Only the owner can.")

    target_member.delete()
    return Response({"message": "Member was successfully kicked from the community."}, status=status.HTTP_200_OK)
