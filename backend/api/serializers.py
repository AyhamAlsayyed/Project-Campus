from django.contrib.auth import get_user_model
from django.db.models import Case, F, IntegerField, Q, When
from rest_framework import serializers

from .models import (
    Comment,
    Community,
    CommunityMember,
    CommunityRequest,
    Conversation,
    ConversationMember,
    Event,
    Friendship,
    Message,
    MessageMedia,
    Notification,
    NotificationSetting,
    Page,
    PageRating,
    Post,
    PostMedia,
    Subscription,
    TeachingPosition,
    UserDegree,
    UserProfile,
)
from .utils.blocked_users import is_normal_post
from .utils.user_type import get_user_avatar

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
            "privacy",
            "friends_list_privacy",
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


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    degrees = serializers.SerializerMethodField()
    teaching_positions = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()
    university_full_name = serializers.SerializerMethodField()
    major = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    academic_title = serializers.SerializerMethodField()
    instructor_type = serializers.SerializerMethodField()
    convention_id = serializers.SerializerMethodField()
    conversation_detail = serializers.SerializerMethodField()
    is_restricted = serializers.SerializerMethodField()
    friends_count = serializers.SerializerMethodField()
    friendship_status = serializers.SerializerMethodField()
    personal_email = serializers.SerializerMethodField()
    picked_communities_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "personal_email",
            "profile",
            "role",
            "university",
            "university_full_name",
            "major",
            "department",
            "academic_title",
            "instructor_type",
            "degrees",
            "teaching_positions",
            "convention_id",
            "conversation_detail",
            "is_restricted",
            "friends_count",
            "friendship_status",
            "picked_communities_count",
        ]

    def _should_restrict_data(self, obj):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            return True

        current_user = request.user
        target_user = obj

        if current_user == target_user:
            return False

        profile = getattr(target_user, "profile", None)
        if not profile or profile.privacy == UserProfile.Privacy.PUBLIC:
            return False

        is_friend = Friendship.objects.filter(
            Q(user1=current_user, user2=target_user) | Q(user1=target_user, user2=current_user),
            status=Friendship.Status.ACCEPTED,
        ).exists()

        return not is_friend

    def get_is_restricted(self, obj):
        return self._should_restrict_data(obj)

    def get_friendship_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            return None

        current_user = request.user
        target_user = obj

        if current_user == target_user:
            return None

        friendship = Friendship.objects.filter(
            Q(user1=current_user, user2=target_user) | Q(user1=target_user, user2=current_user)
        ).first()

        if not friendship:
            return {"status": None, "sent_by_me": False, "sender_id": None}

        sent_by_me = friendship.user1_id == current_user.id

        return {"status": friendship.status, "sent_by_me": sent_by_me, "sender_id": friendship.user1_id}

    def _can_see_friends_list(self, target_user):
        request = self.context.get("request")
        if not request or not request.user:
            return False

        current_user = request.user

        if current_user == target_user:
            return True

        profile = getattr(target_user, "profile", None)
        if not profile:
            return False

        privacy_setting = profile.friends_list_privacy

        if privacy_setting == UserProfile.FriendsListPrivacy.EVERYONE:
            return True

        if privacy_setting == UserProfile.FriendsListPrivacy.NOBODY:
            return False

        if privacy_setting == UserProfile.FriendsListPrivacy.FRIENDS_ONLY:
            if current_user.is_anonymous:
                return False

            return Friendship.objects.filter(
                Q(user1=current_user, user2=target_user) | Q(user1=target_user, user2=current_user),
                status=Friendship.Status.ACCEPTED,
            ).exists()

        return False

    def get_friends_count(self, obj):
        if self._should_restrict_data(obj):
            return None

        if not self._can_see_friends_list(obj):
            return None

        return Friendship.objects.filter(Q(user1=obj) | Q(user2=obj), status=Friendship.Status.ACCEPTED).count()

    def get_profile(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile:
            return None

        serializer = UserProfileSerializer(profile, context=self.context)
        data = serializer.data

        if self._should_restrict_data(obj):
            return {
                "username": obj.username,
                "avatar": data.get("avatar"),
                "privacy": data.get("privacy"),
                "academic_email": None,
                "bio": None,
                "status": "offline",
                "primary_phone": None,
                "secondary_phone": None,
                "birth_date": None,
                "cover": None,
            }
        return data

    def get_degrees(self, obj):
        DEGREE_ORDER = {"PhD": 1, "Master": 2, "Bachelor": 3, "Diploma": 4}
        degrees_qs = obj.degrees.all()
        sorted_degrees = sorted(degrees_qs, key=lambda d: DEGREE_ORDER.get(d.degree_type, 99))
        return UserDegreeSerializer(sorted_degrees, many=True).data

    def get_teaching_positions(self, obj):
        if not hasattr(obj, "instructor_profile"):
            return []
        positions = obj.instructor_profile.teaching_positions.all()
        return TeachingPositionSerializer(positions, many=True).data

    def get_personal_email(self, obj):
        if self._should_restrict_data(obj):
            return None
        return obj.email

    def get_convention_id(self, obj):
        if self._should_restrict_data(obj):
            return None

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

    def get_conversation_detail(self, obj):
        if self._should_restrict_data(obj):
            return None

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
            .select_related("created_by")
            .first()
        )

        if not existing:
            return {"conversation_id": None, "status": None, "is_creator": False}

        return {
            "conversation_id": existing.conversation_id,
            "status": existing.status,
            "is_creator": existing.created_by == current_user,
        }

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
        if self._should_restrict_data(obj):
            return ""
        instructor = getattr(obj, "instructor_profile", None)
        return instructor.department if instructor else ""

    def get_academic_title(self, obj):
        if self._should_restrict_data(obj):
            return ""
        instructor = getattr(obj, "instructor_profile", None)
        return instructor.get_academic_title_display() if instructor and instructor.academic_title else ""

    def get_instructor_type(self, obj):
        if self._should_restrict_data(obj):
            return ""
        instructor = getattr(obj, "instructor_profile", None)
        return instructor.get_instructor_type_display() if instructor and instructor.instructor_type else ""

    def get_picked_communities_count(self, obj):
        if not hasattr(obj, "instructor_profile"):
            return None

        if self._should_restrict_data(obj):
            return None

        return CommunityMember.objects.filter(user=obj, status="approved").count()


class UserMinimalSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    user_type = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "avatar", "user_type"]

    def get_avatar(self, obj):
        request = self.context.get("request")
        if hasattr(obj, "profile") and obj.profile.profile_image and request:
            return request.build_absolute_uri(obj.profile.profile_image.url)
        return None
    def get_user_type(self, obj):
        if hasattr(obj, "page") and obj.page:
            return "page"
        return "user"


class UserDegreeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDegree
        fields = ["id", "degree_type", "major", "institution"]


class TeachingPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeachingPosition
        fields = ["position_id", "institution_name", "employment_type"]


class GroupMemberSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    group_role = serializers.SerializerMethodField()
    conversation_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "avatar",
            "role",
            "group_role",
            "conversation_id",
        ]

    def get_avatar(self, obj):
        request = self.context.get("request")
        return get_user_avatar(request, obj)

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

    def get_group_role(self, obj):
        return getattr(obj, "stashed_group_role", "member")

    def get_conversation_id(self, obj):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            return None

        current_user = request.user
        target_user = obj

        if current_user == target_user:
            return None

        existing_dm = (
            Conversation.objects.filter(is_group=False, members__user=current_user)
            .filter(members__user=target_user)
            .first()
        )

        return existing_dm.conversation_id if existing_dm else None


class BlockedUserListSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "avatar", "university"]

    def get_avatar(self, obj):
        request = self.context.get("request")
        if hasattr(obj, "profile") and obj.profile.profile_image and request:
            return request.build_absolute_uri(obj.profile.profile_image.url)
        return None

    def get_university(self, obj):
        student = getattr(obj, "student_profile", None)
        if student and student.university_page and student.university_page.user:
            return student.university_page.user.username

        instructor = getattr(obj, "instructor_profile", None)
        if instructor and instructor.university_page and instructor.university_page.user:
            return instructor.university_page.user.username

        return None


class PageSerializer(serializers.ModelSerializer):
    page_id = serializers.IntegerField(source="user_id", read_only=True)
    page_name = serializers.SerializerMethodField()
    is_followed = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    average_rating = serializers.ReadOnlyField()
    total_ratings = serializers.ReadOnlyField()
    user_rating = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = [
            "page_id",
            "page_full_name",
            "page_name",
            "page_name_arabic",
            "page_branch",
            "page_type",
            "description",
            "profile_image",
            "banner_image",
            "phone",
            "email",
            "location",
            "link",
            "verified",
            "is_followed",
            "followers_count",
            "total_ratings",
            "average_rating",
            "user_rating",
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

    def get_user_rating(self, obj):
        request = self.context.get("request")

        if request and request.user and request.user.is_authenticated:
            rating = PageRating.objects.filter(page=obj, user=request.user).first()
            if rating:
                return rating.score
        return 0


class CurrentSubscriptionSerializer(serializers.ModelSerializer):
    plan = serializers.CharField(source="tier")

    class Meta:
        model = Subscription
        fields = [
            "plan",
            "price",
            "billing_cycle",
            "is_active",
            "start_date",
            "end_date",
        ]


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
        except Exception:
            return None


class PostSerializer(serializers.ModelSerializer):
    media = PostMediaSerializer(many=True, read_only=True)
    is_saved = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_commented = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()
    top_3comments_avatar = serializers.SerializerMethodField()

    def get_is_saved(self, obj):
        return getattr(obj, "is_saved", False)

    def get_is_liked(self, obj):
        return getattr(obj, "is_liked", False)

    def get_is_commented(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Comment.objects.filter(author=request.user, post=obj).exists()
        return False

    def get_likes_count(self, obj):
        if not is_normal_post(obj):
            return obj.reactions.count()
        return getattr(obj, "reactions_count", obj.reactions.count())

    def get_comments_count(self, obj):
        if not is_normal_post(obj):
            return obj.comments.count()
        return getattr(obj, "comments_count", Comment.objects.filter(post=obj).count())

    def get_author(self, obj):
        user = obj.author
        if not user:
            return None

        request = self.context.get("request")

        try:
            page = user.page
            if page:
                is_followed = False
                is_notified = False
                if request and request.user.is_authenticated:

                    follow_rel = Friendship.objects.filter(
                        user1=request.user,
                        user2=user,
                        status=Friendship.Status.FOLLOWING,
                        relation_type=Friendship.RelationType.USER_TO_PAGE,
                    ).first()
                is_followed = follow_rel is not None
                is_notified = getattr(follow_rel, "is_notified", False) if follow_rel else False
                avatar = page.profile_image.url if page.profile_image else ""
                if request and avatar:
                    avatar = request.build_absolute_uri(avatar)
                return {
                    "id": page.user.id,
                    "is_followed": is_followed,
                    "is_notified": is_notified,
                    "type": "page",
                    "username": page.page_full_name,
                    "avatar": avatar,
                    "tag": page.page_type,
                }
        except Page.DoesNotExist:
            pass

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

    def get_top_3comments_avatar(self, obj):
        request = self.context.get("request")

        comments = (
            Comment.objects.filter(post=obj, parent_comment__isnull=True)
            .select_related("author__profile", "author__page")
            .order_by("-created_at")[:3]
        )

        result = []
        for comment in comments:
            author = comment.author
            if not author:
                continue

            try:
                page = author.page
                if page:
                    avatar = page.profile_image.url if page.profile_image else ""
                    author_name = page.page_full_name
                else:
                    raise Page.DoesNotExist
            except Page.DoesNotExist:
                profile = getattr(author, "profile", None)
                avatar = ""
                if profile and profile.profile_image:
                    avatar = profile.profile_image.url
                author_name = author.username

            if request and avatar:
                avatar = request.build_absolute_uri(avatar)

            result.append(
                {
                    "comment_id": comment.comment_id,
                    "author_name": author_name,
                    "avatar": avatar,
                    "content": comment.content,
                    "created_at": comment.created_at,
                }
            )

        return result

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
            "top_3comments_avatar",
        ]


class CommentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="comment_id", read_only=True)
    author = UserMinimalSerializer(read_only=True)
    reactions_count = serializers.SerializerMethodField()
    has_reacted = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "author",
            "content",
            "parent_comment",
            "reactions_count",
            "has_reacted",
            "replies_count",
            "created_at",
            
        ]

    def get_reactions_count(self, obj):
        """Returns total reactions recorded for this comment."""
        return obj.reactions.count()

    def get_has_reacted(self, obj):
        """Evaluates whether the authenticated client user liked this comment."""
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            return False
        return obj.reactions.filter(user=request.user).exists()

    def get_replies_count(self, obj):
        """Counts direct reply instances underneath this comment thread."""
        return Comment.objects.filter(parent_comment=obj).count()


class CommunitySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="community_id", read_only=True)
    owner_name = serializers.CharField(source="owner.username", read_only=True)
    image = serializers.SerializerMethodField()
    is_private = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(source="verified")

    user_role = serializers.SerializerMethodField()
    is_muted = serializers.SerializerMethodField()
    is_joined = serializers.BooleanField(read_only=True)
    request_sent = serializers.BooleanField(read_only=True)
    members_count = serializers.IntegerField(read_only=True)
    friends_count = serializers.IntegerField(read_only=True)

    highlighted_count = serializers.IntegerField(read_only=True)
    sample_members = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = [
            "id",
            "name",
            "owner_name",
            "description",
            "image",
            "is_private",
            "is_verified",
            "user_role",
            "is_joined",
            "is_muted",
            "request_sent",
            "members_count",
            "friends_count",
            "highlighted_count",
            "sample_members",
            "created_at",
        ]

    def get_image(self, obj):
        request = self.context.get("request")
        if not obj.banner_image:
            return None
        try:
            return request.build_absolute_uri(obj.banner_image.url)
        except Exception:
            return None

    def get_user_role(self, obj):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            return None

        if hasattr(obj, "user_membership_role"):
            return getattr(obj, "user_membership_role")

        membership = CommunityMember.objects.filter(community=obj, user=request.user, status="approved").first()

        return membership.role if membership else None

    def get_is_private(self, obj):
        return obj.privacy == "private"

    def get_is_muted(self, obj):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            return False

        if hasattr(obj, "user_membership_is_muted"):
            return getattr(obj, "user_membership_is_muted")

        return CommunityMember.objects.filter(community=obj, user=request.user, is_muted=True).exists()

    def get_sample_members(self, obj):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            return []

        user = request.user

        friends_ids = (
            Friendship.objects.filter(Q(user1=user) | Q(user2=user), status=Friendship.Status.ACCEPTED)
            .annotate(
                friend_id=Case(
                    When(user1=user, then=F("user2_id")),
                    When(user2=user, then=F("user1_id")),
                    output_field=IntegerField(),
                )
            )
            .values_list("friend_id", flat=True)
        )

        final_users = []
        friend_memberships = CommunityMember.objects.filter(
            community=obj, status="approved", user_id__in=friends_ids
        ).select_related("user", "user__profile")[:3]

        for rel in friend_memberships:
            if rel.user:
                final_users.append(rel.user)

        needed_slots = 3 - len(final_users)
        if needed_slots > 0:
            already_included_ids = [u.id for u in final_users]
            general_memberships = (
                CommunityMember.objects.filter(community=obj, status="approved")
                .exclude(user_id__in=already_included_ids)
                .select_related("user", "user__profile")[:needed_slots]
            )
            for rel in general_memberships:
                if rel.user:
                    final_users.append(rel.user)

        return UserMinimalSerializer(final_users, many=True, context={"request": request}).data

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get("members_count") is None:
            ret["members_count"] = CommunityMember.objects.filter(community=instance, status="approved").count()

        if ret.get("highlighted_count") is None:
            ret["highlighted_count"] = Post.objects.filter(community=instance, is_highlighted=True).count()

        return ret


class CommunityRequestStatusSerializer(serializers.ModelSerializer):
    has_requested = serializers.BooleanField(read_only=True)
    community_name = serializers.CharField(source="name", read_only=True)

    class Meta:
        model = CommunityRequest
        fields = [
            "has_requested",
            "status",
            "community_name",
            "privacy",
            "purpose_statement",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]


class CommunityMemberSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source="user.id")
    username = serializers.ReadOnlyField(source="user.username")
    avatar = serializers.SerializerMethodField()
    profile_role = serializers.SerializerMethodField()

    class Meta:
        model = CommunityMember
        fields = [
            "id",
            "username",
            "avatar",
            "profile_role",
            "role",
            "status",
            "joined_at",
        ]

    def get_avatar(self, obj):
        request = self.context.get("request")
        return get_user_avatar(request, obj.user)

    def get_profile_role(self, obj):
        user = obj.user
        if hasattr(user, "page") and user.page:
            return user.page.page_type
        if hasattr(user, "student_profile"):
            return "student"
        if hasattr(user, "instructor_profile"):
            return "instructor"
        if hasattr(user, "admin_profile"):
            return "admin"
        return "unknown"


class EventSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="event_id", read_only=True)
    page_id = serializers.IntegerField(source="page.user_id", read_only=True)
    organization_name = serializers.CharField(source="page.page_full_name")
    page_type = serializers.CharField(source="page.page_type")
    avatar = serializers.SerializerMethodField()
    banner = serializers.SerializerMethodField()

    is_muted = serializers.SerializerMethodField()
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
            "is_muted",
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

    def get_is_muted(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated or not obj.page:
            return False

        return Friendship.objects.filter(
            user1=request.user,
            user2=obj.page.user,
            relation_type=Friendship.RelationType.USER_TO_PAGE,
            status=Friendship.Status.FOLLOWING,
            is_muted=True,
        ).exists()

    def get_is_reminded(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.reminders.filter(user=request.user).exists()
        return False


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
        if hasattr(actor, "page") and actor.page.profile_image:
            avatar_url = actor.page.profile_image.url
        elif hasattr(actor, "profile") and actor.profile.profile_image:
            avatar_url = actor.profile.profile_image.url

        if avatar_url:
            return request.build_absolute_uri(avatar_url) if request else avatar_url

        return "/default-avatar.png"

    def get_time(self, obj):
        return obj.created_at.strftime("%H:%M") if obj.created_at else ""

    def get_iconType(self, obj):
        return obj.type

    def get_link(self, obj):
        if not obj.content_type or not obj.object_id:
            return None

        model_class = obj.content_type.model_class()

        if model_class == Post:
            try:
                post = Post.objects.get(pk=obj.object_id)
                return {
                    "post": PostSerializer(post, context=self.context).data,
                }
            except Post.DoesNotExist:
                return None

        if model_class == Comment:
            # find which post the comment belongs to
            try:
                comment = Comment.objects.select_related("post").get(pk=obj.object_id)
                return {
                    "post_id": comment.post.post_id,
                    "comment_id": comment.comment_id,
                    "post": PostSerializer(comment.post, context=self.context).data,
                }
            except Comment.DoesNotExist:
                return None

        if model_class == Community:
            return obj.object_id

        if model_class == Event:
            return obj.object_id

        if model_class == Friendship or obj.type in ["friend_request", "follow"]:
            if obj.actor:
                if hasattr(obj.actor, "page"):
                    return obj.actor.page.page_id
                return obj.actor.id
        return None


class NotificationSettingSerializer(serializers.ModelSerializer):
    disabled_by_master = serializers.SerializerMethodField()

    class Meta:
        model = NotificationSetting
        fields = [
            "enable_all",
            "disabled_by_master",
            "friend_request",
            "post_reacted",
            "post_commented",
            "comment_replied",
            "page_announcement",
            "community_new_post",
            "community_join_request_status",
            "new_event",
            "event_updated_cancelled",
            "dm_existing_chat",
            "dm_new_request",
            "group_chat",
            "password_changed",
            "email_updated",
        ]

    def get_disabled_by_master(self, obj):
        return not obj.enable_all

    """
    def validate(self, data):
        days = data.get("event_reminder_days")
        if days is not None and (days < 1 or days > 7):
            raise serializers.ValidationError(
                {"event_reminder_days": "Reminder buffer range must be between 1 and 7 days."}
            )
        return data
    """


class ConversationSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="conversation.conversation_id", read_only=True)
    name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    preview = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    is_group = serializers.BooleanField(source="conversation.is_group", read_only=True)
    is_academic = serializers.BooleanField(source="conversation.is_academic", read_only=True)
    status = serializers.SerializerMethodField()
    user_status = serializers.SerializerMethodField()
    conversations_owner = serializers.SerializerMethodField()
    other_member_id = serializers.SerializerMethodField()
    allow_members_to_edit_settings = serializers.BooleanField(
        source="conversation.allow_members_to_edit_settings", read_only=True
    )
    allow_members_to_send_messages = serializers.BooleanField(
        source="conversation.allow_members_to_send_messages", read_only=True
    )
    allow_members_to_add_others = serializers.BooleanField(
        source="conversation.allow_members_to_add_others", read_only=True
    )

    class Meta:
        model = ConversationMember
        fields = [
            "id",
            "name",
            "avatar",
            "description",
            "role",
            "preview",
            "time",
            "last_message_time",
            "unread_count",
            "is_pinned",
            "is_muted",
            "is_group",
            "is_academic",
            "status",
            "user_status",
            "conversations_owner",
            "other_member_id",
            "allow_members_to_edit_settings",
            "allow_members_to_send_messages",
            "allow_members_to_add_others",
        ]

    def _get_other_member(self, obj):
        request = self.context.get("request")
        if not request:
            return None

        conv = obj.conversation
        all_members = conv.members.all()
        return next((m for m in all_members if m.user != request.user), None)

    def get_name(self, obj):
        conv = obj.conversation
        if conv.is_group:
            return conv.name or "Group"

        other_member_obj = self._get_other_member(obj)
        if other_member_obj:
            other_user = other_member_obj.user
            return other_user.username if other_user else "Deleted Account"
        return "Unknown"

    def get_avatar(self, obj):
        request = self.context.get("request")
        conv = obj.conversation
        if conv.is_group:
            return request.build_absolute_uri(conv.image.url) if conv.image else ""

        other_member_obj = self._get_other_member(obj)
        if other_member_obj and other_member_obj.user:
            return get_user_avatar(request, other_member_obj.user)
        return ""

    def get_description(self, obj):
        description = obj.conversation.description
        return description if description else ""

    def get_preview(self, obj):
        last_msg = obj.conversation.last_message
        if not last_msg:
            return ""

        request = self.context.get("request")
        current_user = request.user if request else None

        if last_msg.sender == current_user:
            prefix = "You: "
        elif last_msg.sender:
            prefix = f"{last_msg.sender.username}: "
        else:
            prefix = "System: "

        message_body = ""
        if last_msg.content and last_msg.content.strip():
            message_body = last_msg.content
        elif last_msg.shared_post_id:
            message_body = "shared a post"
        else:
            first_media = last_msg.media.all().first()
            if first_media:
                media_type = first_media.media_type
                if media_type in ["image", "video", "audio"]:
                    message_body = f"sent a {media_type}" if media_type == "video" else f"sent an {media_type}"
                elif media_type == "file":
                    message_body = "sent an attachment"
                else:
                    message_body = "sent a link"
            else:
                message_body = "sent a message"

        return f"{prefix}{message_body}"

    def get_time(self, obj):
        last_msg = obj.conversation.last_message
        if last_msg and last_msg.sent_at:
            return last_msg.sent_at.strftime("%H:%M")
        return ""

    def get_last_message_time(self, obj):
        last_msg = obj.conversation.last_message
        return last_msg.sent_at if last_msg else None

    def get_unread_count(self, obj):
        conv = obj.conversation
        msg_query = Message.objects.filter(conversation=conv)

        if obj.last_read_at:
            msg_query = msg_query.filter(sent_at__gt=obj.last_read_at)
        if obj.cleared_at:
            msg_query = msg_query.filter(sent_at__gt=obj.cleared_at)

        return msg_query.count()

    def get_status(self, obj):
        return obj.conversation.status

    def get_user_status(self, obj):
        conv = obj.conversation
        if not conv.is_group:
            other_member_obj = self._get_other_member(obj)
            if other_member_obj and other_member_obj.user:
                profile = getattr(other_member_obj.user, "profile", None)
                if profile:
                    return profile.status
            return "offline"

        return None

    def get_conversations_owner(self, obj):
        conv = obj.conversation
        return conv.created_by.username if conv.created_by else None

    def get_other_member_id(self, obj):
        conv = obj.conversation
        if conv.is_group:
            return None
        other_member_obj = self._get_other_member(obj)
        if other_member_obj and other_member_obj.user:
            return other_member_obj.user.id
        return None


class MessageMediaSerializer(serializers.ModelSerializer):
    # Maps internal 'media_id' safely to explicit output tracking ID
    id = serializers.IntegerField(source="media_id", read_only=True)

    class Meta:
        model = MessageMedia
        fields = ["id", "media_type", "media_file", "media_url", "order_index"]


class MessageSerializer(serializers.ModelSerializer):
    # Maps internal 'message_id' column to frontend 'id'
    id = serializers.IntegerField(source="message_id", read_only=True)
    sender = UserMinimalSerializer(read_only=True)
    media = MessageMediaSerializer(many=True, read_only=True)

    # Return string representation of the shared post summary if present
    shared_post_title = serializers.CharField(source="shared_post.title", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "content",
            "shared_post",
            "shared_post_title",
            "parent_message",
            "sent_at",
            "media",
        ]
        read_only_fields = ["sent_at"]
