from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    Comment,
    Community,
    Conversation,
    Event,
    Friendship,
    Notification,
    Page,
    Post,
    PostMedia,
    PostReaction,
    SavedPost,
    UserDegree,
    UserProfile,
)
from .utils.blocked_users import get_all_blocked_relationships, is_normal_post

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "full_name",
            "academic_email",
            "bio",
            "status",
            "primary_phone",
            "secondary_phone",
            "birth_date",
            "avatar",
            "cover",
        ]

    def get_avatar(self, obj):
        request = self.context.get("request")
        if obj.profile_image and request:
            return request.build_absolute_uri(obj.profile_image.url)
        return None

    def get_cover(self, obj):
        request = self.context.get("request")
        if obj.banner_image and request:
            return request.build_absolute_uri(obj.banner_image.url)
        return None


class UserDegreeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDegree
        fields = ["id", "degree_type", "major", "institution"]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    degrees = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()
    university_full_name = serializers.SerializerMethodField()
    major = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    academic_title = serializers.SerializerMethodField()
    instructor_type = serializers.SerializerMethodField()
    convention_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "profile",
            "role",
            "university",
            "university_full_name",
            "major",
            "department",
            "academic_title",
            "instructor_type",
            "degrees",
            "convention_id",
        ]

    def get_role(self, obj):
        if hasattr(obj, "page") and obj.page:
            return obj.page.page_type
        if hasattr(obj, "student_profile"):
            return "student"
        if hasattr(obj, "instructor_profile"):
            return "instructor"
        if hasattr(obj, "admin_profile"):
            return "admin"
        return "unknown"

    def _get_uni_page(self, obj):
        student = getattr(obj, "student_profile", None)
        if student:
            return student.university_page
        instructor = getattr(obj, "instructor_profile", None)
        if instructor:
            return instructor.university_page
        return None

    def get_university(self, obj):
        page = self._get_uni_page(obj)
        return page.user.username if page and page.user else None

    def get_university_full_name(self, obj):
        page = self._get_uni_page(obj)
        return page.page_full_name if page else None

    def get_major(self, obj):
        student = getattr(obj, "student_profile", None)
        return student.major if student else ""

    def get_department(self, obj):
        instructor = getattr(obj, "instructor_profile", None)
        return instructor.department if instructor else ""

    def get_academic_title(self, obj):
        instructor = getattr(obj, "instructor_profile", None)
        return instructor.get_academic_title_display() if instructor and instructor.academic_title else ""

    def get_instructor_type(self, obj):
        instructor = getattr(obj, "instructor_profile", None)
        return instructor.get_instructor_type_display() if instructor and instructor.instructor_type else ""

    def get_degrees(self, obj):
        DEGREE_ORDER = {"PhD": 1, "Master": 2, "Bachelor": 3, "Diploma": 4}
        degrees_qs = obj.degrees.all()
        sorted_degrees = sorted(degrees_qs, key=lambda d: DEGREE_ORDER.get(d.degree_type, 99))
        return UserDegreeSerializer(sorted_degrees, many=True).data

    def get_convention_id(self, obj):
        request = self.context.get("request")

        if not request or not request.user or request.user.is_anonymous:
            return None

        current_user = request.user
        target_user = obj

        if current_user == target_user:
            return None

        existing = (
            Conversation.objects.filter(is_group=False)
            .filter(members__user=current_user)
            .filter(members__user=target_user)
            .first()
        )

        return existing.conversation_id if existing else None


class PageSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    page_name = serializers.SerializerMethodField()
    is_followed = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    average_rating = serializers.ReadOnlyField()
    total_ratings = serializers.ReadOnlyField()

    class Meta:
        model = Page
        fields = [
            "id",
            "page_full_name",
            "page_name",
            "page_name_arabic",
            "page_branch",
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

    def get_page_name(self, obj):
        if obj.user:
            return obj.user.username
        return ""

    def get_is_followed(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated and obj.user:
            return Friendship.objects.filter(
                user1=request.user,
                user2=obj.user,
                status=Friendship.Status.FOLLOWING,
                relation_type=Friendship.RelationType.USER_TO_PAGE,
            ).exists()
        return False

    def get_followers_count(self, obj):
        if obj.user:
            return Friendship.objects.filter(
                user2=obj.user, status=Friendship.Status.FOLLOWING, relation_type=Friendship.RelationType.USER_TO_PAGE
            ).count()
        return 0


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
    is_commented = serializers.SerializerMethodField()
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

    def get_is_commented(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Comment.objects.filter(author=request.user, post=obj).exists()
        return False

    def get_likes_count(self, obj):
        """
        For normal posts: exclude likes from blocked users
        For community posts: show all likes
        """

        if not is_normal_post(obj):
            # Community post - show all likes
            return obj.reactions.count()

        # Normal post - exclude blocked users
        if obj.author_id:  # for this serves nothing but i might need it when i do the page block system
            blocked_map = get_all_blocked_relationships()
            blocked_users = blocked_map.get(obj.author_id, set()) if obj.author_id else set()

            if blocked_users:
                return obj.reactions.exclude(user_id__in=blocked_users).count()

        return obj.reactions.count()

    def get_comments_count(self, obj):
        """
        For normal posts: exclude comments from blocked users
        For community posts: show all comments
        """
        if not is_normal_post(obj):
            return obj.comments.count()

        # Normal post - exclude blocked users
        if obj.author_id:
            blocked_map = get_all_blocked_relationships()
            blocked_users = blocked_map.get(obj.author_id, set())

            if blocked_users:
                return Comment.objects.filter(post=obj).exclude(author_id__in=blocked_users).count()

        return Comment.objects.filter(post=obj).count()

    def get_author(self, obj):
        user = obj.author
        if not user:
            return None

        request = self.context.get("request")

        if hasattr(user, "page"):
            page = user.page
            avatar = page.profile_image.url if page.profile_image else ""
            if request and avatar:
                avatar = request.build_absolute_uri(avatar)

            return {
                "id": page.user.id,
                "type": "page",
                "username": page.page_full_name,
                "avatar": avatar,
                "tag": page.page_type,
            }

        profile = getattr(user, "profile", None)
        avatar = ""
        if profile and profile.profile_image:
            avatar = profile.profile_image.url
            if request:
                avatar = request.build_absolute_uri(avatar)

        return {
            "id": user.id,
            "type": "user",
            "username": user.username,
            "avatar": avatar,
            "tag": None,
        }

    class Meta:
        model = Post
        fields = [
            "post_id",
            "content_text",
            "post_type",
            "author",
            "community",
            "created_at",
            "media",
            "is_saved",
            "is_liked",
            "is_commented",
            "likes_count",
            "comments_count",
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
        request = self.context.get("request")
        actor = obj.actor

        if not actor:
            return "/default-avatar.png"

        avatar_url = None

        if hasattr(actor, "page"):
            if actor.page.profile_image:
                avatar_url = actor.page.profile_image.url

        elif hasattr(actor, "profile"):
            if actor.profile.profile_image:
                avatar_url = actor.profile.profile_image.url

        if avatar_url:
            return request.build_absolute_uri(avatar_url) if request else avatar_url

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

        if model_class == Friendship or obj.type in ["friend_request", "follow"]:
            if obj.actor:
                if hasattr(obj.actor, "page"):
                    return obj.actor.page.page_id
                return obj.actor.id

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
    page_id = serializers.IntegerField(source="page.user_id", read_only=True)
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
            "page_id",
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
