from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    Comment,
    Community,
    Event,
    FollowPage,
    Friendship,
    Notification,
    Page,
    Post,
    PostMedia,
    PostReaction,
    SavedPost,
    UserProfile,
)
from .utils.blocked_users import get_all_blocked_relationships, is_normal_post

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["full_name", "profile_image", "banner_image", "bio", "status", "academic_email"]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    role = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "profile", "role", "university"]

    def get_role(self, obj):
        if hasattr(obj, "student_profile"):
            return "Student"
        elif hasattr(obj, "instructor_profile"):
            return "Instructor"
        elif hasattr(obj, "admin_profile"):
            return "Admin"
        return "User"

    def get_university(self, obj):
        if hasattr(obj, "student_profile") and obj.student_profile.university_page:
            return obj.student_profile.university_page.page_full_name
        if hasattr(obj, "instructor_profile") and obj.instructor_profile.university_page:
            return obj.instructor_profile.university_page.page_full_name
        return None


class PageSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="page_id", read_only=True)
    is_followed = serializers.SerializerMethodField()
    followers_count = serializers.IntegerField(source="followers.count", read_only=True)
    average_rating = serializers.ReadOnlyField()
    total_ratings = serializers.ReadOnlyField()

    class Meta:
        model = Page
        fields = [
            "id",
            "page_full_name",
            "page_name",
            "page_type",
            "description",
            "profile_image",
            "banner_image",
            "verified",
            "is_followed",
            "followers_count",
            "total_ratings",
            "average_rating",
        ]

    def get_is_followed(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return FollowPage.objects.filter(user=request.user, page=obj).exists()
        return False


class PostMediaSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="media_type")
    url = serializers.SerializerMethodField()

    class Meta:
        model = PostMedia
        fields = ["type", "url"]

    def get_url(self, obj):
        request = self.context.get("request")
        f = obj.media_file if obj.media_file else obj.media_url
        if not f:
            return None
        try:
            return request.build_absolute_uri(f.url) if hasattr(f, "url") else f
        except Exception():
            return None


class PostSerializer(serializers.ModelSerializer):
    media = PostMediaSerializer(many=True, read_only=True)
    is_saved = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return SavedPost.objects.filter(user=request.user, post=obj).exists()
        return False

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return PostReaction.objects.filter(user=request.user, post=obj).exists()
        return False

    def get_likes_count(self, obj):
        """
        For normal posts: exclude likes from blocked users
        For community posts: show all likes
        """

        if not is_normal_post(obj):
            # Community post - show all likes
            return PostReaction.objects.filter(post=obj, user__isnull=False).count()

        # Normal post - exclude blocked users
        if obj.author_user_id:
            blocked_map = get_all_blocked_relationships()
            blocked_users = blocked_map.get(obj.author_user_id, set())

            if blocked_users:
                return (
                    PostReaction.objects.filter(post=obj, user__isnull=False).exclude(user_id__in=blocked_users).count()
                )

        return PostReaction.objects.filter(post=obj, user__isnull=False).count()

    def get_comments_count(self, obj):
        """
        For normal posts: exclude comments from blocked users
        For community posts: show all comments
        """
        if not is_normal_post(obj):
            # Community post - show all comments
            return Comment.objects.filter(post=obj).count()

        # Normal post - exclude blocked users
        if obj.author_user_id:
            blocked_map = get_all_blocked_relationships()
            blocked_users = blocked_map.get(obj.author_user_id, set())

            if blocked_users:
                return Comment.objects.filter(post=obj).exclude(author_user_id__in=blocked_users).count()

        return Comment.objects.filter(post=obj).count()

    def get_author(self, obj):
        request = self.context.get("request")

        if obj.author_user:
            profile = getattr(obj.author_user, "profile", None)
            avatar = None
            if profile and profile.profile_image:
                avatar = request.build_absolute_uri(profile.profile_image.url) if request else profile.profile_image.url

            return {
                "id": obj.author_user_id,
                "type": "user",
                "username": obj.author_user.username,
                "avatar": avatar,
                "tag": None,
            }

        if obj.author_page:
            avatar = None
            if obj.author_page.profile_image:
                avatar = (
                    request.build_absolute_uri(obj.author_page.profile_image.url)
                    if request
                    else obj.author_page.profile_image.url
                )

            return {
                "id": obj.author_page_id,
                "type": "page",
                "username": obj.author_page.page_full_name,
                "avatar": avatar,
                "tag": obj.author_page.page_type,
            }

        return None

    class Meta:
        model = Post
        fields = [
            "post_id",
            "content_text",
            "post_type",
            "author_user",
            "author_page",
            "community",
            "created_at",
            "media",
            "is_saved",
            "is_liked",
            "likes_count",
            "comments_count",
            "author",
            "is_pinned",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    iconType = serializers.SerializerMethodField()
    link = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "notification_id",
            "type",
            "content",
            "is_read",
            "avatar",
            "time",
            "iconType",
            "link",
        ]

    def get_avatar(self, obj):
        if obj.actor_user and hasattr(obj.actor_user, "profile"):
            if obj.actor_user.profile.profile_image:
                return obj.actor_user.profile.profile_image.url

        if obj.actor_page:
            if obj.actor_page.profile_image:
                return obj.actor_page.profile_image.url

        return "/default-avatar.png"

    def get_time(self, obj):
        return obj.created_at.strftime("%H:%M")

    def get_iconType(self, obj):
        return obj.type

    def get_link(self, obj):
        if not obj.content_type or not obj.object_id:
            return None

        model_class = obj.content_type.model_class()

        if model_class == Post:
            return obj.object_id

        if model_class == Comment:
            # find which post the comment belongs to
            try:
                comment = Comment.objects.select_related("post").get(pk=obj.object_id)
                return {
                    "post_id": comment.post_id,
                    "comment_id": comment.comment_id,
                }
            except Comment.DoesNotExist:
                return None

        if model_class == Community:
            return obj.object_id

        if model_class == Friendship:
            if obj.actor_user:
                return obj.actor_user_id
            else:
                return None

        # friend request / user profile
        if obj.actor_user:
            return obj.actor_user_id

        if obj.actor_page:
            return obj.actor_page_id

        return None


class CommunitySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="community_id", read_only=True)

    image = serializers.SerializerMethodField()
    is_private = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(source="verified")

    is_joined = serializers.BooleanField(read_only=True)
    request_sent = serializers.BooleanField(read_only=True)
    members_count = serializers.IntegerField(read_only=True)
    friends_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Community
        fields = [
            "id",
            "name",
            "description",
            "image",
            "is_private",
            "is_verified",
            "is_joined",
            "request_sent",
            "members_count",
            "friends_count",
        ]

    def get_image(self, obj):
        request = self.context.get("request")

        if not obj.banner_image:
            return None

        try:
            return request.build_absolute_uri(obj.banner_image.url)
        except Exception:
            return None

    def get_is_private(self, obj):
        return obj.privacy == "private"


class EventSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="event_id", read_only=True)

    organization_name = serializers.CharField(source="page.page_full_name")
    page_type = serializers.CharField(source="page.page_type")
    avatar = serializers.SerializerMethodField()
    banner = serializers.SerializerMethodField()

    is_followed = serializers.BooleanField(read_only=True)
    is_reminded = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "organization_name",
            "page_type",
            "avatar",
            "banner",
            "is_followed",
            "is_reminded",
            "start_date",
            "end_date",
            "title",
            "description",
            "image",
        ]

    def get_avatar(self, obj):
        request = self.context.get("request")

        if obj.page and obj.page.profile_image:
            try:
                return request.build_absolute_uri(obj.page.profile_image.url)
            except Exception:
                return None
        return None

    def get_banner(self, obj):
        request = self.context.get("request")

        if obj.page and obj.page.banner_image:
            try:
                return request.build_absolute_uri(obj.page.banner_image.url)
            except Exception:
                return None
        return None

    def get_is_reminded(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.reminders.filter(user=request.user).exists()
        return False

    def image(self, obj):
        request = self.context.get("request")
        if obj.image:
            try:
                return request.build_absolute_uri(obj.image.url)
            except Exception:
                return None
        return None
