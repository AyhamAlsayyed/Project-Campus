from rest_framework import serializers

from .models import (
    Comment,
    Community,
    Event,
    Friendship,
    Notification,
    Post,
    PostMedia,
    SavedPost,
)


class PostMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostMedia
        fields = ["media_id", "media_type", "media_file", "media_url"]


class PostSerializer(serializers.ModelSerializer):
    media = PostMediaSerializer(many=True, read_only=True)
    is_saved = serializers.SerializerMethodField()

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated():
            return SavedPost.objects.filter(user=request.user, post=obj).exists()
        return False

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
        """
        if model_class == Message:
            this is handled in the messaging popup
        """
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

    organization_name = serializers.CharField(source="page.page_name")
    avatar = serializers.SerializerMethodField()
    banner = serializers.SerializerMethodField()

    is_followed = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "organization_name",
            "avatar",
            "banner",
            "is_followed",
            "start_date",
            "end_date",
            "title",
            "description",
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
