from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import (
    Community,
    CommunityMember,
    Friendship,
    Instructor,
    Notification,
    NotificationSetting,
    Page,
    Post,
    PostMedia,
    Student,
)
from ...serializers import PostSerializer
from ...utils.feed import base_annotations

User = get_user_model()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_post(request):
    user = request.user
    content = request.data.get("content", "")
    medias = request.FILES.getlist("images")
    files = request.FILES.getlist("files")
    community_id = request.data.get("community")

    post_type_input = request.data.get("post_type", Post.PostType.NORMAL)
    is_announcement = post_type_input == Post.PostType.ANNOUNCEMENT
    is_academic = post_type_input == Post.PostType.ACADEMY

    if is_announcement and not medias:
        return Response({"error": "An image is required for the announcement."}, status=status.HTTP_400_BAD_REQUEST)

    community = None
    if community_id:
        try:
            community = Community.objects.get(pk=community_id)
        except Community.DoesNotExist:
            return Response({"error": "Community not found"}, status=status.HTTP_400_BAD_REQUEST)

    if is_academic and not hasattr(user, "instructor_profile"):
        return Response(
            {"error": "Only instructors are allowed to create academy posts."},
            status=status.HTTP_403_FORBIDDEN,
        )

    post = Post.objects.create(content_text=content, author=user, community=community, post_type=post_type_input)

    media_index = 0
    for media in medias:
        content_type = media.content_type
        media_type = PostMedia.MediaType.FILE

        if content_type.startswith("image/"):
            media_type = PostMedia.MediaType.IMAGE
        elif content_type.startswith("video/"):
            media_type = PostMedia.MediaType.VIDEO
        elif content_type.startswith("audio/") or media.name.endswith((".mp3", ".wav")):
            media_type = PostMedia.MediaType.AUDIO

        PostMedia.objects.create(post=post, media_type=media_type, media_file=media, order_index=media_index)
        media_index += 1

    for file in files:
        PostMedia.objects.create(
            post=post, media_type=PostMedia.MediaType.FILE, media_file=file, order_index=media_index
        )
        media_index += 1

    # notification
    recipient_users = set()
    notification_content_text = f"{user.username} posted something new"
    db_enum_type = Notification.Type.POST_CREATED
    notification_type_key = "friend_post"

    has_page = Page.objects.filter(user=user).first()

    if is_announcement:
        db_enum_type = Notification.Type.ANNOUNCEMENTS
        page_name = has_page.page_full_name if has_page else user.username

        if has_page and has_page.page_type == Page.PageType.UNIVERSITY:
            notification_type_key = "university_official"
            notification_content_text = f"Official University Announcement: {page_name} posted an update."

            student_recipients = Student.objects.filter(university_page=has_page).values_list("user_id", flat=True)
            instructor_recipients = Instructor.objects.filter(university_page=has_page).values_list(
                "user_id", flat=True
            )

            combined_ids = set(student_recipients).union(set(instructor_recipients))
            recipient_users.update(User.objects.filter(id__in=combined_ids).exclude(id=user.id))
        else:
            notification_type_key = "page_announcement"
            notification_content_text = f"New announcement from {page_name}"

            if has_page:
                page_followers = (
                    Friendship.objects.filter(
                        user2=user,
                        relation_type=Friendship.RelationType.USER_TO_PAGE,
                        status=Friendship.Status.FOLLOWING,
                    )
                    .exclude(is_muted=True)
                    .select_related("user1")
                )
                recipient_users.update([f.user1 for f in page_followers if f.user1])
            else:
                recipient_users.update(User.objects.exclude(id=user.id))

    elif is_academic:
        if community:
            notification_type_key = "community_post"
            notification_content_text = f"New Academic material posted by {user.username} in {community.name}"

            members = (
                CommunityMember.objects.filter(community=community, status=CommunityMember.Status.APPROVED)
                .exclude(user=user)
                .exclude(is_muted=True)
                .select_related("user")
            )
            recipient_users.update([m.user for m in members if m.user])
        else:
            notification_type_key = "friend_post"
            notification_content_text = f"New Academic materials posted by {user.username}"

            friendships = (
                Friendship.objects.filter(
                    Q(user1=user) | Q(user2=user),
                    status=Friendship.Status.ACCEPTED,
                    relation_type=Friendship.RelationType.USER_TO_USER,
                )
                .exclude(is_muted=True)
                .select_related("user1", "user2")
            )
            for friendship in friendships:
                friend = friendship.user2 if friendship.user1 == user else friendship.user1
                if friend:
                    recipient_users.add(friend)

    elif has_page:
        notification_type_key = "page_post"
        notification_content_text = f"New post from {has_page.page_full_name}"

        page_followers = (
            Friendship.objects.filter(
                user2=user, relation_type=Friendship.RelationType.USER_TO_PAGE, status=Friendship.Status.FOLLOWING
            )
            .exclude(is_muted=True)
            .select_related("user1")
        )
        recipient_users.update([f.user1 for f in page_followers if f.user1])

    elif community:
        notification_type_key = "community_post"
        notification_content_text = f"{user.username} posted in {community.name}"

        members = (
            CommunityMember.objects.filter(community=community, status=CommunityMember.Status.APPROVED)
            .exclude(user=user)
            .exclude(is_muted=True)
            .select_related("user")
        )
        recipient_users.update([m.user for m in members if m.user])

    else:
        friendships = (
            Friendship.objects.filter(
                Q(user1=user) | Q(user2=user),
                status=Friendship.Status.ACCEPTED,
                relation_type=Friendship.RelationType.USER_TO_USER,
            )
            .exclude(is_muted=True)
            .select_related("user1", "user2")
        )

        for friendship in friendships:
            friend = friendship.user2 if friendship.user1 == user else friendship.user1
            if friend:
                recipient_users.add(friend)

    if recipient_users:
        recipient_ids = [u.id for u in recipient_users]
        settings_lookup = {
            setting.user_id: setting for setting in NotificationSetting.objects.filter(user_id__in=recipient_ids)
        }

        notifications_to_create = []
        post_content_type = ContentType.objects.get_for_model(post)

        for recipient in recipient_users:
            profile = settings_lookup.get(recipient.id)

            if profile:
                if notification_type_key != "university_official":
                    if not profile.enable_all:
                        continue

                    if notification_type_key == "page_announcement" and not profile.page_announcement:
                        continue
                    elif notification_type_key == "community_post" and not profile.community_new_post:
                        continue

            notifications_to_create.append(
                Notification(
                    receiver=recipient,
                    actor=user,
                    type=db_enum_type,
                    content=notification_content_text,
                    content_type=post_content_type,
                    object_id=post.post_id,
                )
            )

        if notifications_to_create:
            Notification.objects.bulk_create(notifications_to_create)

    post = (
        Post.objects.filter(post_id=post.post_id)
        .annotate(**base_annotations(user))
        .select_related("author__profile")
        .prefetch_related("media")
        .first()
    )

    serializer = PostSerializer(post, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
