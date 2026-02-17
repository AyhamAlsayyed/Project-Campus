from django.contrib.auth.models import User
from django.db import models

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


class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
        db_column="user_id",  # keeps ERD-style column name
    )

    full_name = models.CharField(max_length=255, blank=True, null=True)

    profile_image = models.URLField(blank=True, null=True)
    banner_image = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    # Better to use Django's built-in User.is_active for account status.
    # Keep this only if you want extra states besides active/inactive.
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        DEACTIVATED = "deactivated", "Deactivated"

    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_profile"

    def __str__(self):
        return self.user.username


class Page(models.Model):
    page_id = models.BigAutoField(primary_key=True, db_column="page_id")

    owner_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pages", db_column="user_id")

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
        User,
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
        ASSISTANT_PROF = "asst_prof", "Assistant Professor"
        ASSOCIATE_PROF = "assoc_prof", "Associate Professor"
        LECTURER = "lecturer", "Lecturer"
        INSTRUCTOR = "instructor", "Instructor"

    class InstructorType(models.TextChoices):
        FULL_TIME = "full_time", "Full Time"
        PART_TIME = "part_time", "Part Time"

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="user_id",
        related_name="instructor_profile",
    )

    academic_title = models.CharField(
        max_length=20,
        choices=AcademicTitle.choices,
        blank=True,
        null=True,
    )

    department = models.CharField(max_length=100, blank=True, null=True)

    instructor_type = models.CharField(
        max_length=10,
        choices=InstructorType.choices,
        blank=True,
        null=True,
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
        User,
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
    major = models.CharField(max_length=100, blank=True, null=True)
    academic_level = models.CharField(max_length=50, blank=True, null=True)

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
        User,
        on_delete=models.CASCADE,
        related_name="friendships_sent",
        db_column="user1_id",
    )
    user2 = models.ForeignKey(
        User,
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

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications", db_column="user_id")

    type = models.CharField(max_length=50)
    content = models.TextField()

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification"


class Community(models.Model):
    community_id = models.BigAutoField(primary_key=True, db_column="community_id")

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    privacy = models.CharField(max_length=50, default="public")
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="community_memberships", db_column="user_id")

    role = models.CharField(max_length=50, default="member")
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
    location = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "event"


class EventReminder(models.Model):
    reminder_id = models.BigAutoField(primary_key=True, db_column="reminder_id")

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="reminders", db_column="event_id")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="event_reminders", db_column="user_id")

    reminder_time = models.DateTimeField()

    class Meta:
        db_table = "event_reminder"
        constraints = [
            models.UniqueConstraint(fields=["event", "user", "reminder_time"], name="uniq_event_user_time"),
        ]


class Post(models.Model):
    post_id = models.BigAutoField(primary_key=True, db_column="post_id")

    content_text = models.TextField(blank=True, null=True)
    post_type = models.CharField(max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)

    author_user = models.ForeignKey(
        User,
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

    class Meta:
        db_table = "post"


class PostMedia(models.Model):
    media_id = models.BigAutoField(primary_key=True, db_column="media_id")

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="media", db_column="post_id")

    media_type = models.CharField(max_length=50)
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

    author_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="comments_as_user",
        db_column="author_user_id",
    )
    author_page = models.ForeignKey(
        Page,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="comments_as_page",
        db_column="author_page_id",
    )

    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="replies",
        db_column="parent_comment_id",
    )

    class Meta:
        db_table = "comment"


class PostReaction(models.Model):
    post_reaction_id = models.BigAutoField(primary_key=True, db_column="post_reaction_id")

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="reactions", db_column="post_id")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_reactions", db_column="user_id")
    page = models.ForeignKey(
        Page, on_delete=models.SET_NULL, null=True, blank=True, related_name="post_reactions", db_column="page_id"
    )

    class Meta:
        db_table = "post_reaction"
        constraints = [
            models.UniqueConstraint(fields=["post", "user", "page"], name="uniq_post_reaction_actor"),
        ]


class CommentReaction(models.Model):
    comment_reaction_id = models.BigAutoField(primary_key=True, db_column="comment_reaction_id")

    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="reactions", db_column="comment_id")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comment_reactions", db_column="user_id")
    page = models.ForeignKey(
        Page, on_delete=models.SET_NULL, null=True, blank=True, related_name="comment_reactions", db_column="page_id"
    )

    class Meta:
        db_table = "comment_reaction"
        constraints = [
            models.UniqueConstraint(fields=["comment", "user", "page"], name="uniq_comment_reaction_actor"),
        ]


class FollowPage(models.Model):
    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="page_follows", db_column="user_id")
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversations", db_column="user_id")
    page = models.ForeignKey(
        Page, on_delete=models.SET_NULL, null=True, blank=True, related_name="conversations", db_column="page_id"
    )

    class Meta:
        db_table = "conversation_member"
        constraints = [
            models.UniqueConstraint(fields=["conversation", "user", "page"], name="uniq_conversation_member_actor"),
        ]


class Message(models.Model):
    message_id = models.BigAutoField(primary_key=True, db_column="message_id")

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages", db_column="conversation_id"
    )

    content = models.TextField(blank=True, null=True)

    sender_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_messages",
        db_column="sender_user_id",
    )
    sender_page = models.ForeignKey(
        Page,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_messages",
        db_column="sender_page_id",
    )

    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "message"


class MessageMedia(models.Model):
    media_id = models.BigAutoField(primary_key=True, db_column="media_id")

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="media", db_column="message_id")

    media_type = models.CharField(max_length=50)
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="message_reactions", db_column="user_id")
    page = models.ForeignKey(
        Page, on_delete=models.SET_NULL, null=True, blank=True, related_name="message_reactions", db_column="page_id"
    )

    message_reaction_type = models.CharField(max_length=50)

    class Meta:
        db_table = "message_reaction"
        constraints = [
            models.UniqueConstraint(
                fields=["message", "user", "page", "message_reaction_type"],
                name="uniq_msg_reaction",
            ),
        ]


class Report(models.Model):
    report_id = models.BigAutoField(primary_key=True, db_column="report_id")

    reporter_user = models.ForeignKey(
        User,
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
    content_type = models.CharField(max_length=50)

    reason = models.TextField()
    final_action = models.CharField(max_length=50, blank=True, null=True)

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
