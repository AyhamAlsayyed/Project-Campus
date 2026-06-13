from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, CommunityMember, Instructor
from ...serializers import CommunitySerializer


@api_view(["GET"])
def instructor_community_picks(request, instructor_id):
    instructor = get_object_or_404(Instructor, pk=instructor_id)
    picks = instructor.community_picks.all()

    serializer = CommunitySerializer(picks, many=True, context={"request": request})

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_pick(request, community_id):
    instructor = request.user.instructor_profile
    community = get_object_or_404(Community, pk=community_id)

    if community in instructor.community_picks.all():
        instructor.community_picks.remove(community)
        return Response({"message": "Removed from picks"})
    else:
        instructor.community_picks.add(community)
        return Response({"message": "Added to picks"})


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
        membership = CommunityMember.objects.select_related("community").get(community=community, user=request.user)
    except CommunityMember.DoesNotExist:
        raise ValidationError({"detail": "You are not a member of this community."})

    was_owner = membership.role == CommunityMember.Role.OWNER

    with transaction.atomic():
        membership.delete()

        if not was_owner:
            return Response({"detail": "You have successfully left the community."}, status=status.HTTP_200_OK)

        successor = (
            CommunityMember.objects.filter(community=community, role=CommunityMember.Role.ADMIN)
            .order_by("joined_at")
            .select_for_update()
            .first()
        )

        if not successor:
            successor = (
                CommunityMember.objects.filter(community=community, role=CommunityMember.Role.MEMBER)
                .order_by("joined_at")
                .select_for_update()
                .first()
            )

        if not successor:
            community.delete()
            return Response(
                {"detail": "You were the last member. The community has been deleted."},
                status=status.HTTP_200_OK,
            )

        successor.role = CommunityMember.Role.OWNER
        successor.save(update_fields=["role"])

        community.owner = successor.user
        community.save(update_fields=["owner"])

    return Response(
        {"detail": f"You successfully left. Ownership transferred to {successor.user.username}."},
        status=status.HTTP_200_OK,
    )
