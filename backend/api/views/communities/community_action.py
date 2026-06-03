from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, CommunityMember, Instructor, Post, Report
from ...serializers import CommunitySerializer
from ...utils.community import ensure_community_admin


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

    if community in instructor.featured_communities.all():
        instructor.featured_communities.remove(community)
        return Response({"message": "Removed from picks"})
    else:
        instructor.featured_communities.add(community)
        return Response({"message": "Added to picks"})


@api_view(["DELETE", "POST"])
@permission_classes([IsAuthenticated])
def remove_community_highlight(request, community_id, post_id):
    ensure_community_admin(request.user, community_id)

    community = get_object_or_404(Community, pk=community_id)
    post = get_object_or_404(Post, pk=post_id)

    if post.community_id != community.pk:
        return Response({"error": "This post does not belong to this community."}, status=status.HTTP_400_BAD_REQUEST)

    if post.is_highlighted:
        post.is_highlighted = False
        post.highlighted_at = None

        post.save(update_fields=["is_highlighted", "highlighted_at"])
        return Response({"message": "Post successfully removed from highlights."}, status=status.HTTP_200_OK)

    return Response({"error": "Post is not currently featured in highlights."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def dismiss_post_report(request, community_id, post_id):
    ensure_community_admin(request.user, community_id)

    post_content_type = ContentType.objects.get_for_model(Post)

    reports = Report.objects.filter(
        content_type_obj=post_content_type, object_id=post_id, university_page_id=community_id, final_action=""
    )

    if not reports.exists():
        return Response(
            {"error": "No active reports found for this post in this community."}, status=status.HTTP_404_NOT_FOUND
        )

    reports.update(final_action="dismissed")

    return Response({"message": "Reports for this post have been successfully dismissed."}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_reported_post(request, post_id):
    post = get_object_or_404(Post, pk=post_id)

    is_author = post.author_id == request.user.id
    is_community_moderator = False

    if post.community_id:
        is_community_moderator = CommunityMember.objects.filter(
            community_id=post.community_id,
            user=request.user,
            role__in=[CommunityMember.Role.OWNER, CommunityMember.Role.ADMIN],
        ).exists()

    if not (is_author or is_community_moderator):
        raise PermissionDenied("You do not have permission to delete this post.")

    post.delete()
    return Response({"message": "Post successfully deleted."}, status=status.HTTP_200_OK)


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
