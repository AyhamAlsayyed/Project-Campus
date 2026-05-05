from rest_framework import serializers

from .models import (
    Comment,
    Community,
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
