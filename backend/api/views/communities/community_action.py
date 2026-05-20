from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, CommunityMember


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_community_notifications(request, pk):
    community = get_object_or_404(Community, pk=pk)

    try:
        membership = CommunityMember.objects.get(
            community=community, user=request.user, status=CommunityMember.Status.APPROVED
        )
    except CommunityMember.DoesNotExist:
        raise PermissionDenied("You must be an approved member of this community to manage notifications.")

    membership.is_muted = not membership.is_muted
    membership.save(update_fields=["is_muted"])

    is_notified = not membership.is_muted

    return Response(
        {"detail": "Notification settings updated successfully.", "is_notified": is_notified}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def leave_community(request, pk):
    community = get_object_or_404(Community, pk=pk)

    try:
        membership = CommunityMember.objects.get(community=community, user=request.user)
    except CommunityMember.DoesNotExist:
        raise ValidationError({"detail": "You are not a member of this community."})

    # for now the owner cant leave but i might make it so that the oldest admin became the owner
    if membership.role == CommunityMember.Role.OWNER:
        raise PermissionDenied("The owner can't leave")

    membership.delete()

    return Response({"detail": "You have successfully left the community."}, status=status.HTTP_200_OK)
