from datetime import timedelta

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Avg, Q
from django.utils import timezone

"""
DJANGO_USER_FIELDS = {
    "id": "AutoField/BigAutoField (primary key)",
    "username": "CharField(max_length=150, unique=True)",
    "password": "CharField(max_length=128)  # stores hashed password",
    "email": "EmailField(blank=True)",
    "first_name": "CharField(max_length=150, blank=True)",
    "last_name": "CharField(max_length=150, blank=True)",
    "is_active": "BooleanField(default=True)  # can log in?",
    "is_staff": "BooleanField(default=False)  # can access admin?",
    "is_superuser": "BooleanField(default=False)  # all permissions",
    "last_login": "DateTimeField(blank=True, null=True)",
    "date_joined": "DateTimeField(default=timezone.now)",
    "groups": "ManyToManyField(Group, blank=True)",
    "user_permissions": "ManyToManyField(Permission, blank=True)",
}
"""


# helper functions:


def validate_exactly_one(instance, field_a, field_b):
    a = getattr(instance, field_a)
    b = getattr(instance, field_b)
    if bool(a) == bool(b):
        raise ValidationError(f"Exactly one of '{field_a}' or '{field_b}' must be set.")


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
        db_column="user_id",
    )

    full_name = models.CharField(max_length=255, blank=True)
    academic_email = models.EmailField(blank=True)
    profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)
    banner_image = models.ImageField(upload_to="banners/", blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)

    class Status(models.TextChoices):
        ONLINE = "online", "Online"
        AWAY = "away", "Away"
        DO_NOT_DISTURB = "dnd", "Do Not Disturb"
        OFFLINE = "offline", "Offline"
        SUSPENDED = "suspended", "Suspended"

    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ONLINE)
    primary_phone = models.CharField(max_length=11, blank=True, null=True)
    secondary_phone = models.CharField(max_length=11, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_profile"

    def __str__(self):
        return self.user.username


class UserDegree(models.Model):
    id = models.BigAutoField(primary_key=True)

    class DegreeType(models.TextChoices):
        DIPLOMA = "Diploma"
        BACHELOR = "Bachelor"
        MASTER = "Master"
        PHD = "PhD"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="degrees",
        db_column="user_id",
    )

    degree_type = models.CharField(max_length=20, choices=DegreeType.choices)
    major = models.CharField(max_length=100, blank=True)
    institution = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "user_degree"


class EmailVerification(models.Model):
    id = models.BigAutoField(primary_key=True)

    username = models.CharField(max_length=150)
    academic_email = models.EmailField(db_column="academic_email")
    code = models.CharField(max_length=6)

    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def set_expiry(self, minutes=10):
        self.expires_at = timezone.now() + timedelta(minutes=minutes)

    def is_expired(self):
        return timezone.now() > self.expires_at

    class Meta:
        db_table = "email_verification"
        indexes = [
            models.Index(fields=["academic_email"]),
        ]


class Page(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="page",
        db_column="user_id",
        null=True,
        blank=True,
    )

    page_full_name = models.CharField(max_length=255)
    page_name_arabic = models.CharField(max_length=255, null=True, blank=True)
    page_branch = models.CharField(max_length=255, null=True, blank=True)

    class PageType(models.TextChoices):
        UNIVERSITY = "university", "University"
        EDUCATIONAL = "educational", "Educational"
        LIBRARY = "library", "Library"
        LAB = "lab", "Lab"
        CAFETERIA = "cafeteria", "Cafeteria"
        CAFE = "cafe", "Cafe"
        RESTAURANT = "restaurant", "Restaurant"
        SHOP = "shop", "Shop"
        GYM = "gym", "Gym"
        STUDENT_CLUB = "student_club", "Student Club"
        SERVICE = "service", "Service"
        OTHER = "other", "Other"

    page_type = models.CharField(
        max_length=20,
        choices=PageType.choices,
        default=PageType.OTHER,
    )

    description = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)
    banner_image = models.ImageField(upload_to="banners/", blank=True, null=True)
    phone = models.CharField(max_length=11, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    link = models.URLField(blank=True, null=True)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "page"

    @property
    def average_rating(self):
        avg = self.ratings.aggregate(Avg("score"))["score__avg"]
        return round(avg, 1) if avg else 0

    @property
    def total_ratings(self):
        return self.ratings.count()

    def __str__(self):
        return self.page_full_name


class PageRating(models.Model):
    page = models.ForeignKey("Page", on_delete=models.CASCADE, related_name="ratings")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    score = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("page", "user")

    def __str__(self):
        return f"{self.user.username} rated {self.page.user.username}: {self.score}"


class UniversityDomain(models.Model):
    id = models.BigAutoField(primary_key=True)

    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="email_domains",
        db_column="page_id",
    )

    domain = models.CharField(max_length=255, unique=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "university_domain"
        indexes = [models.Index(fields=["domain"])]


class Admin(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="user_id",
        related_name="admin_profile",
    )

    class Meta:
        db_table = "admin"


class Instructor(models.Model):
    class AcademicTitle(models.TextChoices):
        DOCTOR = "dr", "Doctor"
        PROFESSOR = "prof", "Professor"
        ASSISTANT = "asst", "Assistant"
        LECTURER = "lecturer", "Lecturer"
        ADVISER = "adviser", "Adviser"

    class InstructorType(models.TextChoices):
        FULL_TIME = "full_time", "Full Time"
        PART_TIME = "part_time", "Part Time"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="user_id",
        related_name="instructor_profile",
    )

    academic_title = models.CharField(
        max_length=20,
        choices=AcademicTitle.choices,
        blank=True,
    )

    department = models.CharField(max_length=100, blank=True)

    instructor_type = models.CharField(
        max_length=10,
        choices=InstructorType.choices,
        blank=True,
    )

    university_page = models.ForeignKey(
        Page,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="instructors",
        db_column="university_page_id",
    )

    community_picks = models.ManyToManyField(
        "Community",
        blank=True,
        related_name="picked_by_instructors",
    )

    class Meta:
        db_table = "instructor"


class Student(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="user_id",
        related_name="student_profile",
    )

    university_page = models.ForeignKey(
        Page,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
        db_column="university_page_id",
    )

    class AcademicLevel(models.TextChoices):
        DIPLOMA = "diploma", "Diploma"
        BACHELOR = "bachelor", "Bachelor"
        MASTER = "master", "Master"
        PHD = "phd", "PhD"

    major = models.CharField(max_length=100, blank=True)
    academic_level = models.CharField(max_length=20, choices=AcademicLevel.choices, blank=True)

    class Meta:
        db_table = "student"


class Friendship(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        BLOCKED = "blocked", "Blocked"

    friendship_id = models.BigAutoField(primary_key=True, db_column="friendship_id")

    user1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendships_sent",
        db_column="user1_id",
    )
    user2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendships_received",
        db_column="user2_id",
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )

    class Meta:
        db_table = "friendship"
        constraints = [
            models.UniqueConstraint(fields=["user1", "user2"], name="uniq_friendship_pair"),
        ]


class Community(models.Model):
    community_id = models.BigAutoField(primary_key=True, db_column="community_id")

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    class Privacy(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"

    privacy = models.CharField(
        max_length=10,
        choices=Privacy.choices,
        default=Privacy.PUBLIC,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    banner_image = models.ImageField(upload_to="banners/", blank=True, null=True)
    verified = models.BooleanField(default=False)

    class Meta:
        db_table = "community"

    def __str__(self):
        return self.name


class CommunityMember(models.Model):
    id = models.BigAutoField(primary_key=True)

    community = models.ForeignKey(
        Community, on_delete=models.CASCADE, related_name="memberships", db_column="community_id"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_memberships", db_column="user_id"
    )

    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"

    role = models.CharField(
        max_length=50,
        choices=Role.choices,
        default=Role.MEMBER,
    )

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "community_member"
        constraints = [
            models.UniqueConstraint(fields=["community", "user"], name="uniq_community_user"),
        ]


class Event(models.Model):
    event_id = models.BigAutoField(primary_key=True, db_column="event_id")

    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="events", db_column="page_id")

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="events/", blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        db_table = "event"


class EventReminder(models.Model):
    reminder_id = models.BigAutoField(primary_key=True, db_column="reminder_id")

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="reminders", db_column="event_id")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_reminders", db_column="user_id"
    )

    reminder_time = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self._state.adding and not self.reminder_time and self.event and self.event.start_date:
            self.reminder_time = self.event.start_date - timedelta(hours=1)
        super().save(*args, **kwargs)

    class Meta:
        db_table = "event_reminder"
        constraints = [
            models.UniqueConstraint(fields=["event", "user"], name="uniq_event_user_time"),
        ]


class Post(models.Model):
    post_id = models.BigAutoField(primary_key=True, db_column="post_id")
    title = models.CharField(max_length=255, null=True, blank=True)
    content_text = models.TextField(blank=True, null=True)

    class PostType(models.TextChoices):
        ANNOUNCEMENT = "announcement", "Announcement"
        ADVERTISMENT = "advertisement", "Advertisement"
        ACADEMY = "academy", "Academy"
        NORMAL = "normal", "Normal"

    post_type = models.CharField(
        max_length=20,
        choices=PostType.choices,
        default=PostType.NORMAL,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    is_pinned = models.BooleanField(default=False)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
        db_column="author_id",
    )

    community = models.ForeignKey(
        Community,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
        db_column="community_id",
    )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "post"


class SavedPost(models.Model):
    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_posts",
        db_column="user_id",
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="saved_by",
        db_column="post_id",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "saved_post"
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["user", "post"], name="uniq_user_saved_post")]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["post"]),
        ]


class PostMedia(models.Model):
    media_id = models.BigAutoField(primary_key=True, db_column="media_id")

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="media", db_column="post_id")

    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"
        FILE = "file", "File"
        URL = "url", "URL"

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
    )

    media_file = models.FileField(upload_to="messages/", blank=True, null=True)
    media_url = models.URLField(blank=True, null=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "post_media"
        constraints = [
            models.UniqueConstraint(fields=["post", "order_index"], name="uniq_post_media_order"),
        ]


class Comment(models.Model):
    comment_id = models.BigAutoField(primary_key=True, db_column="comment_id")

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments", db_column="post_id")

    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="comments",
        db_column="author_id",
    )
    # if it's the top comment it will save "null"
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        db_column="parent_comment_id",
    )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "comment"


class PostReaction(models.Model):
    post_reaction_id = models.BigAutoField(primary_key=True, db_column="post_reaction_id")

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="reactions", db_column="post_id")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="post_reactions",
        db_column="user_id",
    )

    def clean(self):
        qs = PostReaction.objects.filter(post_id=self.post_id)
        if self.user_id is not None:
            qs = qs.filter(user_id=self.user_id)

        if self.pk:
            qs = qs.exclude(pk=self.pk)

        if qs.exists():
            raise ValidationError("Duplicate reaction: this actor already reacted to this post.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "post_reaction"
        constraints = [
            models.UniqueConstraint(
                fields=["post", "user"],
                condition=Q(user__isnull=False),
                name="uniq_post_reaction_user",
            ),
        ]


class CommentReaction(models.Model):
    comment_reaction_id = models.BigAutoField(primary_key=True, db_column="comment_reaction_id")

    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="reactions", db_column="comment_id")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="comment_reactions",
        db_column="user_id",
    )

    def clean(self):
        qs = CommentReaction.objects.filter(comment_id=self.comment_id)
        if self.user_id is not None:
            qs = qs.filter(user_id=self.user_id)

        if self.pk:
            qs = qs.exclude(pk=self.pk)

        if qs.exists():
            raise ValidationError("Duplicate reaction: this actor already reacted to this comment.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "comment_reaction"
        constraints = [
            models.UniqueConstraint(
                fields=["comment", "user"],
                condition=Q(user__isnull=False),
                name="uniq_comment_reaction_user",
            ),
        ]


class FollowPage(models.Model):
    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="page_follows", db_column="user_id"
    )

    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="followers", db_column="page_id")

    followed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "follow_page"
        constraints = [
            models.UniqueConstraint(fields=["user", "page"], name="uniq_user_page_follow"),
        ]


class Conversation(models.Model):
    conversation_id = models.BigAutoField(primary_key=True, db_column="conversation_id")

    name = models.CharField("conversation name", max_length=100, blank=True, null=True)
    image = models.ImageField("conversation image", upload_to="conversation_images", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_group = models.BooleanField(default=False)
    is_private = models.BooleanField(default=False)
    is_academic = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_conversations",
        db_column="created_by_id",
    )

    last_message = models.ForeignKey(
        "Message",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        db_column="last_message_id",
    )

    def clean(self):
        if not self.created_by:
            raise ValidationError("Group must have a creator.")

    class Meta:
        db_table = "conversation"


class ConversationMember(models.Model):
    id = models.BigAutoField(primary_key=True)

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="members",
        db_column="conversation_id",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conversations",
        db_column="user_id",
    )

    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"

    role = models.CharField(
        max_length=50,
        choices=Role.choices,
        default=Role.MEMBER,
    )

    is_pinned = models.BooleanField(default=False)
    is_muted = models.BooleanField(default=False)

    last_read_at = models.DateTimeField(null=True, blank=True)
    cleared_at = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.conversation.is_group and hasattr(self.user, "page"):
            raise ValidationError("Users associated with a Page cannot join group conversations.")

        qs = ConversationMember.objects.filter(conversation_id=self.conversation_id)

        if self.user_id is not None:
            qs = qs.filter(user_id=self.user_id)

        if self.pk:
            qs = qs.exclude(pk=self.pk)

        if qs.exists():
            raise ValidationError("Duplicate member.")

    def save(self, *args, **kwargs):
        """if self.conversation.is_group and self.page_id is not None:
            raise ValidationError("Pages cannot join group conversations.")
        self.full_clean()"""
        super().save(*args, **kwargs)

    class Meta:
        db_table = "conversation_member"
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "user"],
                condition=Q(user__isnull=False),
                name="uniq_conversation_user",
            ),
        ]


class Message(models.Model):
    message_id = models.BigAutoField(primary_key=True, db_column="message_id")

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
        db_column="conversation_id",
    )

    content = models.TextField(blank=True, null=True)
    shared_post = models.ForeignKey("post", on_delete=models.SET_NULL, null=True, blank=True)

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_messages",
        db_column="sender_id",
    )

    parent_message = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        db_column="parent_message_id",
    )

    sent_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

        if self.conversation.last_message_id != self.message_id:
            self.conversation.last_message = self
            self.conversation.save(update_fields=["last_message"])

    class Meta:
        db_table = "message"
        ordering = ["sent_at"]
        indexes = [
            models.Index(fields=["conversation", "-sent_at"]),
        ]


class MessageMedia(models.Model):
    media_id = models.BigAutoField(primary_key=True, db_column="media_id")

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="media", db_column="message_id")

    # same as thing in "class PostMedia"
    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"
        FILE = "file", "File"
        URL = "url", "URL"

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
    )

    media_file = models.FileField(upload_to="messages/", blank=True, null=True)
    media_url = models.URLField(blank=True, null=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "message_media"
        constraints = [
            models.UniqueConstraint(fields=["message", "order_index"], name="uniq_message_media_order"),
        ]


class MessageReaction(models.Model):
    message_reaction_id = models.BigAutoField(primary_key=True, db_column="message_reaction_id")

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="reactions", db_column="message_id")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="message_reactions",
        db_column="user_id",
    )
    message_reaction_type = models.CharField(max_length=50)

    def clean(self):

        qs = MessageReaction.objects.filter(
            message_id=self.message_id,
            message_reaction_type=self.message_reaction_type,
        )
        if self.user_id is not None:
            qs = qs.filter(user_id=self.user_id)

        if self.pk:
            qs = qs.exclude(pk=self.pk)

        if qs.exists():
            raise ValidationError("Duplicate reaction: this actor already used this reaction type on this message.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "message_reaction"
        constraints = [
            models.UniqueConstraint(
                fields=["message", "user", "message_reaction_type"],
                condition=Q(user__isnull=False),
                name="uniq_msg_reaction_user_type",
            ),
        ]


class Report(models.Model):
    report_id = models.BigAutoField(primary_key=True, db_column="report_id")

    content_type_obj = models.ForeignKey(ContentType, on_delete=models.CASCADE, db_column="content_type_id")
    object_id = models.PositiveBigIntegerField()
    reported_content = GenericForeignKey("content_type_obj", "object_id")

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
        db_column="reporter_id",
    )

    class ContentType(models.TextChoices):
        HARASSMENT_ABUSE = "harassment_abuse", "Harassment & Abuse"
        VIOLENCE_HARM = "violence_harm", "Violence & Harm"
        SEXUAL_CONTENT_EXPLOITATION = "sexual_content_exploitation", "Sexual Content & Exploitation"
        CHILD_SAFETY = "child_safety", "Child Safety"
        HATE_EXTREMISM = "hate_extremism", "Hate & Extremism"
        SELF_HARM_DANGEROUS_BEHAVIOR = "self_harm_dangerous_behavior", "Self-Harm & Dangerous Behavior"
        MISINFORMATION_MANIPULATION = "misinformation_manipulation", "Misinformation & Manipulation"
        PRIVACY_IMPERSONATION = "privacy_impersonation", "Privacy & Impersonation"
        SPAM_SCAMS_FRAUD = "spam_scams_fraud", "Spam, Scams & Fraud"
        ILLEGAL_IP_VIOLATIONS = "illegal_ip_violations", "Illegal & Intellectual Property Violations"
        OTHER = "other", "Other"

    content_type = models.CharField(
        max_length=50,
        choices=ContentType.choices,
    )

    reason = models.TextField()

    class FinalAction(models.TextChoices):
        CONTENT_REMOVAL = "content_removal", "Content removal"
        WARNING_STRIKE = "warning_strike", "Warning / Strike"
        TEMP_RESTRICTION = "temp_restriction", "Temporary restriction (limited features or short suspension)"
        TEMP_SUSPENSION = "temp_suspension", "Temporary suspension"
        PERMANENT_BAN = "permanent_ban", "Permanent ban"
        ACCOUNT_DELETION = "account_deletion", "Account deletion"
        CONTENT_LABELING = "content_labeling", "Content labeling (warning / sensitive tag)"
        REPORT_AUTHORITIES = "report_authorities", "Report to authorities (for severe illegal cases)"

    final_action = models.CharField(
        max_length=50,
        choices=FinalAction.choices,
    )

    university_page = models.ForeignKey(
        Page,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_received",
        db_column="university_page_id",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "report"


class Notification(models.Model):
    notification_id = models.BigAutoField(primary_key=True, db_column="notification_id")

    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
        db_column="user_id",
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications_sent",
        db_column="actor_id",
    )

    class Type(models.TextChoices):
        FRIEND_REQUEST = "friend_request", "Friend Request"
        ACCEPTED_FRIEND_REQUEST = "accepted_friend_request", "Accepted Friend Request"
        ANNOUNCEMENTS = "announcements", "Announcements"
        LIKE = "like", "Like"
        COMMENT = "comment", "Comment"
        MESSAGE = "message", "Message"
        UPCOMING_EVENT = "upcoming_event", "Upcoming Event"
        SYSTEM = "system", "System"
        REACTED_TO_YOUR_POST = "reacted_post", "Reacted to your post"
        POST_CREATED = "post_created", "New Post Created"

    type = models.CharField(
        max_length=30,
        choices=Type.choices,
    )
    content = models.TextField()

    # referenc to
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if bool(self.content_type) != bool(self.object_id):
            raise ValidationError("content_type and object_id must be set together.")

    class Meta:
        db_table = "notification"

        indexes = [
            models.Index(
                fields=["receiver"],
                name="notif_unread_idx",
                condition=Q(is_read=False, receiver__isnull=False),
            ),
            models.Index(fields=["content_type", "object_id"], name="notif_generic_lookup_idx"),
            models.Index(fields=["-created_at"], name="notif_created_at_idx"),
        ]

    def __str__(self):
        return f"{self.receiver} - {self.type}"
