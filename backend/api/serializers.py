from rest_framework import serializers

from .models import Post, PostMedia


class PostMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostMedia
        fields = ["media_id", "media_type", "media_file", "media_url"]


class PostSerializer(serializers.ModelSerializer):
    media = PostMediaSerializer(many=True, read_only=True)

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
        ]
