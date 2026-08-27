from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, CommunityMember, Post, Report
from ...serializers import CommunityMemberSerializer, PostSerializer
from ...utils.community import ensure_community_admin
from ...utils.notifications import send_global_notification


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_join_requests(request, community_id):
    ensure_community_admin(request.user, community_id)

    pending_members = CommunityMember.objects.filter(
        community_id=community_id, status=CommunityMember.Status.PENDING
    ).select_related("user")

    serializer = CommunityMemberSerializer(pending_members, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_join_request(request, community_id, member_id):
    admin_user = request.user
    action = request.data.get("action")

    if action not in ["approve", "reject"]:
        return Response({"error": "Invalid action. Use 'approve' or 'reject'."}, status=400)

    try:
        community = Community.objects.get(community_id=community_id)
    except Community.DoesNotExist:
        return Response({"error": "Community not found"}, status=404)

    is_authorized = CommunityMember.objects.filter(
        community=community,
        user=admin_user,
        role__in=[CommunityMember.Role.OWNER, CommunityMember.Role.ADMIN],
        status="approved",
    ).exists()

    if not is_authorized:
        return Response({"error": "You do not have permission to manage this community."}, status=403)

    membership = (
        CommunityMember.objects.filter(community=community, user_id=member_id, status="pending")
        .select_related("user")
        .first()
    )

    if not membership:
        return Response({"error": "No pending join request found for this user."}, status=404)

    if action == "approve":
        membership.status = "approved"
        membership.save()

        send_global_notification(
            sender=admin_user,
            receiver=membership.user,
            notification_type="COMMUNITY JOIN STATUS",
            target_object=community,
            custom_text=f"Your request to join {community.name} was approved!",
        )
        return Response({"message": "User approved successfully."})

    else:  # action == "reject"
        membership.delete()

        send_global_notification(
            sender=admin_user,
            receiver=membership.user,
            notification_type="COMMUNITY JOIN STATUS",
            target_object=community,
            custom_text=f"Your request to join {community.name} was rejected.",
        )
        return Response({"message": "User request rejected."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_post_requests(request, community_id):
    ensure_community_admin(request.user, community_id)

    pending_posts = Post.objects.filter(community_id=community_id, is_approved=False).select_related("author")

    serializer = PostSerializer(pending_posts, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_post_request(request, community_id, post_id):
    ensure_community_admin(request.user, community_id)
    post = get_object_or_404(Post, pk=post_id, community_id=community_id)

    action = request.data.get("action")
    if action == "approve":
        post.is_approved = True
        post.save(update_fields=["is_approved"])
        return Response({"message": "Post request has been approved successfully."}, status=status.HTTP_200_OK)

    if action == "reject":
        post.delete()
        return Response(
            {"message": "Post request has been rejected and successfully removed."}, status=status.HTTP_200_OK
        )

    return Response(
        {"error": "Invalid action. Choose either 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST
    )


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
