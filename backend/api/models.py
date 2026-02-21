from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

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

    profile_image = models.URLField(blank=True, null=True)
    banner_image = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    class Status(models.TextChoices):
        ONLINE = "online", "Online"
        AWAY = "away", "Away"
        DO_NOT_DISTURB = "dnd", "Do Not Disturb"
        OFFLINE = "offline", "Offline"
        SUSPENDED = "suspended", "Suspended"

    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ONLINE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_profile"

    def __str__(self):
        return self.user.username


class Page(models.Model):
    page_id = models.BigAutoField(primary_key=True, db_column="page_id")

    page_name = models.CharField(max_length=255)
    page_type = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)

    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "page"

    def __str__(self):
        return self.page_name


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

    # ayham: should we make the "major" here to be predefined as i did to the academic_level?
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


class Notification(models.Model):
    notification_id = models.BigAutoField(primary_key=True, db_column="notification_id")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications", db_column="user_id"
    )

    class Type(models.TextChoices):
        EVENTS = "events", "Events"
        COMMENTS = "comments", "Comments"
        ACCEPTED_FRIEND_REQUEST = "accepted_friend_request", "Accepted friend request"
        MESSAGES = "messages", "Messages"
        ANNOUNCEMENTS = "announcements", "Announcements"

    type = models.CharField(
        max_length=30,
        choices=Type.choices,
    )
    content = models.TextField()

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification"


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
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True)

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
            models.UniqueConstraint(fields=["event", "user", "reminder_time"], name="uniq_event_user_time"),
        ]


class Post(models.Model):
    post_id = models.BigAutoField(primary_key=True, db_column="post_id")

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

    author_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts_as_user",
        db_column="author_user_id",
    )
    author_page = models.ForeignKey(
        Page,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts_as_page",
        db_column="author_page_id",
    )

    community = models.ForeignKey(
        Community,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
        db_column="community_id",
    )

    def clean(self):
        validate_exactly_one(self, "author_user", "author_page")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "post"
        constraints = [
            models.CheckConstraint(
                check=(
                    (Q(author_user__isnull=False) & Q(author_page__isnull=True))
                    | (Q(author_user__isnull=True) & Q(author_page__isnull=False))
                ),
                name="chk_post_author",
            ),
        ]


class PostMedia(models.Model):
    media_id = models.BigAutoField(primary_key=True, db_column="media_id")

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="media", db_column="post_id")

    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"
        URL = "url", "URL"

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
    )
    # ayham: wdym by "media_url" light
    media_url = models.URLField()
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
    # this is the author of the comment if he is a "user" (person and not a page)
    author_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="comments_as_user",
        db_column="author_user_id",
    )
    # and this is the author of the comment if he is a "page"
    # you said you WANT CASCADE here (deleting page deletes its comments)
    author_page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="comments_as_page",
        db_column="author_page_id",
    )
    # if its the top comment it will save "null"
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        db_column="parent_comment_id",
    )

    def clean(self):
        validate_exactly_one(self, "author_user", "author_page")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "comment"
        constraints = [
            models.CheckConstraint(
                check=(
                    (Q(author_user__isnull=False) & Q(author_page__isnull=True))
                    | (Q(author_user__isnull=True) & Q(author_page__isnull=False))
                ),
                name="chk_comment_author",
            ),
        ]


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

    page = models.ForeignKey(
        Page, on_delete=models.SET_NULL, null=True, blank=True, related_name="post_reactions", db_column="page_id"
    )

    def clean(self):
        validate_exactly_one(self, "user", "page")

        # SQLite safety: enforce "one reaction per actor per post" in app layer too
        qs = PostReaction.objects.filter(post_id=self.post_id)
        if self.user_id is not None:
            qs = qs.filter(user_id=self.user_id)
        else:
            qs = qs.filter(page_id=self.page_id)

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
            models.CheckConstraint(
                check=((Q(user__isnull=False) & Q(page__isnull=True)) | (Q(user__isnull=True) & Q(page__isnull=False))),
                name="chk_post_reaction_author",
            ),
            models.UniqueConstraint(
                fields=["post", "user"],
                condition=Q(user__isnull=False),
                name="uniq_post_reaction_user",
            ),
            models.UniqueConstraint(
                fields=["post", "page"],
                condition=Q(page__isnull=False),
                name="uniq_post_reaction_page",
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

    page = models.ForeignKey(
        Page, on_delete=models.CASCADE, null=True, blank=True, related_name="comment_reactions", db_column="page_id"
    )

    def clean(self):
        validate_exactly_one(self, "user", "page")

        # SQLite safety: enforce "one reaction per actor per comment" in app layer too
        qs = CommentReaction.objects.filter(comment_id=self.comment_id)
        if self.user_id is not None:
            qs = qs.filter(user_id=self.user_id)
        else:
            qs = qs.filter(page_id=self.page_id)

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
            models.CheckConstraint(
                check=((Q(user__isnull=False) & Q(page__isnull=True)) | (Q(user__isnull=True) & Q(page__isnull=False))),
                name="chk_comment_reaction_author",
            ),
            models.UniqueConstraint(
                fields=["comment", "user"],
                condition=Q(user__isnull=False),
                name="uniq_comment_reaction_user",
            ),
            models.UniqueConstraint(
                fields=["comment", "page"],
                condition=Q(page__isnull=False),
                name="uniq_comment_reaction_page",
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

    created_at = models.DateTimeField(auto_now_add=True)
    is_group = models.BooleanField(default=False)

    class Meta:
        db_table = "conversation"


class ConversationMember(models.Model):
    id = models.BigAutoField(primary_key=True)

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="members", db_column="conversation_id"
    )
    # ayham2: here you want if the user/page is deleted the convo is not? right
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conversations",
        db_column="user_id",
    )

    page = models.ForeignKey(
        Page, on_delete=models.SET_NULL, null=True, blank=True, related_name="conversations", db_column="page_id"
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

    def clean(self):
        validate_exactly_one(self, "user", "page")

        # SQLite safety: enforce "member can't be added twice to same conversation"
        qs = ConversationMember.objects.filter(conversation_id=self.conversation_id)
        if self.user_id is not None:
            qs = qs.filter(user_id=self.user_id)
        else:
            qs = qs.filter(page_id=self.page_id)

        if self.pk:
            qs = qs.exclude(pk=self.pk)

        if qs.exists():
            raise ValidationError("Duplicate member: this actor is already in this conversation.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "conversation_member"
        constraints = [
            models.CheckConstraint(
                check=((Q(user__isnull=False) & Q(page__isnull=True)) | (Q(user__isnull=True) & Q(page__isnull=False))),
                name="chk_conversation_member_author",
            ),
            models.UniqueConstraint(
                fields=["conversation", "user"],
                condition=Q(user__isnull=False),
                name="uniq_conversation_user",
            ),
            models.UniqueConstraint(
                fields=["conversation", "page"],
                condition=Q(page__isnull=False),
                name="uniq_conversation_page",
            ),
        ]


class Message(models.Model):
    message_id = models.BigAutoField(primary_key=True, db_column="message_id")

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages", db_column="conversation_id"
    )

    content = models.TextField(blank=True, null=True)
    # ayham2: here you want if the user/page is deleted the message is not? right
    # this is the author of the massage if he is a "user" (person and not a page)
    sender_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_messages",
        db_column="sender_user_id",
    )
    # and this is the author of the massage if he is a "page"
    sender_page = models.ForeignKey(
        Page,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_messages",
        db_column="sender_page_id",
    )

    sent_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        validate_exactly_one(self, "sender_user", "sender_page")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "message"
        constraints = [
            models.CheckConstraint(
                check=(
                    (Q(sender_user__isnull=False) & Q(sender_page__isnull=True))
                    | (Q(sender_user__isnull=True) & Q(sender_page__isnull=False))
                ),
                name="chk_message_sender",
            ),
        ]


class MessageMedia(models.Model):
    media_id = models.BigAutoField(primary_key=True, db_column="media_id")

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="media", db_column="message_id")

    # same as thing in "class PostMedia"
    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"
        URL = "url", "URL"

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
    )
    media_url = models.URLField()
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
    page = models.ForeignKey(
        Page, on_delete=models.CASCADE, null=True, blank=True, related_name="message_reactions", db_column="page_id"
    )
    message_reaction_type = models.CharField(max_length=50)

    def clean(self):
        validate_exactly_one(self, "user", "page")

        # SQLite safety: enforce "one reaction type per actor per message"
        qs = MessageReaction.objects.filter(
            message_id=self.message_id,
            message_reaction_type=self.message_reaction_type,
        )
        if self.user_id is not None:
            qs = qs.filter(user_id=self.user_id)
        else:
            qs = qs.filter(page_id=self.page_id)

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
            # FIXED: this must check user/page (NOT sender_user/sender_page)
            models.CheckConstraint(
                check=((Q(user__isnull=False) & Q(page__isnull=True)) | (Q(user__isnull=True) & Q(page__isnull=False))),
                name="chk_message_reaction_author",
            ),
            models.UniqueConstraint(
                fields=["message", "user", "message_reaction_type"],
                condition=Q(user__isnull=False),
                name="uniq_msg_reaction_user_type",
            ),
            models.UniqueConstraint(
                fields=["message", "page", "message_reaction_type"],
                condition=Q(page__isnull=False),
                name="uniq_msg_reaction_page_type",
            ),
        ]


class Report(models.Model):
    report_id = models.BigAutoField(primary_key=True, db_column="report_id")

    reporter_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_as_user",
        db_column="reporter_user_id",
    )
    reporter_page = models.ForeignKey(
        Page,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_as_page",
        db_column="reporter_page_id",
    )

    reported_content_id = models.BigIntegerField(db_column="reported_content_id")

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
