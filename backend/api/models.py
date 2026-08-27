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

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        return f"{username} - {self.degree_type} in {self.major or 'General'}"


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

    def __str__(self):
        status = "Verified" if self.is_verified else "Pending"
        return f"Verification for {self.username} ({status})"


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
        db_column="user_id",
    )

    full_name = models.CharField(max_length=255, blank=True)
    academic_email = models.EmailField(blank=True)
    recovery_email = models.EmailField(blank=True)
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

    class Privacy(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"

    class FriendsListPrivacy(models.TextChoices):
        EVERYONE = "EVERYONE", "Everyone"
        FRIENDS_ONLY = "FRIENDS_ONLY", "Friends Only"
        ONLY_ME = "ONLY_ME", "Only Me"

    class MessagePrivacy(models.TextChoices):
        EVERYONE = "EVERYONE", "Everyone"
        FRIENDS_ONLY = "FRIENDS_ONLY", "Friends Only"
        NOBODY = "NOBODY", "Nobody"

    privacy = models.CharField(
        max_length=10,
        choices=Privacy.choices,
        default=Privacy.PUBLIC,
    )
    friends_list_privacy = models.CharField(
        max_length=15, choices=FriendsListPrivacy.choices, default=FriendsListPrivacy.EVERYONE
    )
    message_privacy = models.CharField(max_length=15, choices=MessagePrivacy.choices, default=MessagePrivacy.EVERYONE)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OFFLINE)
    primary_phone = models.CharField(max_length=11, blank=True, null=True)
    secondary_phone = models.CharField(max_length=11, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_profile"

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        return f"Profile of {username}"


class Page(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="page",
        db_column="user_id",
    )

    page_full_name = models.CharField(max_length=255)
    page_name_arabic = models.CharField(max_length=255, null=True, blank=True)
    page_branch = models.CharField(max_length=255, null=True, blank=True)

    class PageType(models.TextChoices):
        UNIVERSITY = "university", "University"
        COLLABORATOR = "collaborator", "Collaborator"
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
        LOCAL_BUSINESS = "local_business", "Local Business"
        YOUTH_DEVELOPMENT_ORGANIZATION = "Youth Developer Organization", "Youth Developer Organization"
        TELECOMMUNICATION = "telecommunication", "Telecommunication"
        OTHER = "other", "Other"

    page_type = models.CharField(
        max_length=30,
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
        return f"{self.page_full_name} ({self.get_page_type_display()})"


class Subscription(models.Model):
    class Tier(models.TextChoices):
        BASIC = "basic", "Basic Subscription"
        PREMIUM = "premium", "Premium Subscription"
        UNIVERSITY = "university", "University (Custom)"

    class BillingCycle(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        ANNUAL = "annual", "Annual"
        CUSTOM = "custom", "Custom Contract"

    subscription_id = models.BigAutoField(primary_key=True, db_column="subscription_id")

    page = models.OneToOneField("Page", on_delete=models.CASCADE, related_name="subscription", db_column="page_id")

    tier = models.CharField(
        max_length=20,
        choices=Tier.choices,
        default=Tier.BASIC,
    )

    price = models.DecimalField(max_digits=6, decimal_places=2, help_text="The price stored in USD")

    billing_cycle = models.CharField(max_length=15, choices=BillingCycle.choices, default=BillingCycle.MONTHLY)

    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(
        null=True, blank=True, help_text="Null means lifetime or indefinite until cancellation"
    )

    class Meta:
        db_table = "subscription"

    def __str__(self):
        return f"{self.page.page_full_name} - {self.get_tier_display()} ({'Active' if self.is_active else 'Inactive'})"

    @property
    def has_verification_badge(self):
        return self.is_active and self.tier in [self.Tier.PREMIUM, self.Tier.UNIVERSITY]

    @property
    def can_bypass_community_approval(self):
        return self.is_active and self.tier in [self.Tier.PREMIUM, self.Tier.UNIVERSITY]

    @property
    def feed_priority(self):
        """Returns standard or high priority depending on tier level."""
        if self.is_active and self.tier in [self.Tier.PREMIUM, self.Tier.UNIVERSITY]:
            return "high"
        return "standard"

    @property
    def is_university_tier(self):
        """Checks if the account has official institutional privileges."""
        return self.is_active and self.tier == self.Tier.UNIVERSITY


class PageRating(models.Model):
    page = models.ForeignKey("Page", on_delete=models.CASCADE, related_name="ratings")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    score = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("page", "user")

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        page_name = self.page.page_full_name if self.page else f"Page {self.page_id}"
        return f"{username} rated {page_name}: {self.score} Stars"


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

    def __str__(self):
        page_name = self.page.page_full_name if self.page else f"Page {self.page_id}"
        return f"@{self.domain} -> {page_name}"


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

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        return f"System Admin: {username}"


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

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        title = self.get_academic_title_display() if self.academic_title else "Instructor"
        return f"{title} {username} - {self.department or 'No Department'}"


class TeachingPosition(models.Model):
    class EmploymentType(models.TextChoices):
        PRIMARY = "primary", "Primary"
        PART_TIME = "part_time", "Part Time"

    position_id = models.BigAutoField(primary_key=True, db_column="position_id")

    instructor = models.ForeignKey(
        "Instructor", on_delete=models.CASCADE, related_name="teaching_positions", db_column="instructor_id"
    )

    institution_name = models.CharField(max_length=255)

    employment_type = models.CharField(
        max_length=15,
        choices=EmploymentType.choices,
        default=EmploymentType.PRIMARY,
    )

    class Meta:
        db_table = "teaching_position"

    def __str__(self):
        return f"{self.instructor.user.username}" f"({self.institution_name} - {self.get_employment_type_display()})"


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

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        level = self.get_academic_level_display() if self.academic_level else "Student"
        return f"{username} ({level} - {self.major or 'Undeclared'})"


class Friendship(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        BLOCKED = "blocked", "Blocked"
        FOLLOWING = "following", "Following"

    class RelationType(models.TextChoices):
        USER_TO_USER = "user_to_user", "User To User"
        USER_TO_PAGE = "user_to_page", "User To Page"
        PAGE_TO_PAGE = "page_to_page", "Page To Page"

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

    relation_type = models.CharField(
        max_length=20,
        choices=RelationType.choices,
        default=RelationType.USER_TO_USER,
    )

    is_muted = models.BooleanField(default=False)

    class Meta:
        db_table = "friendship"
        constraints = [
            models.UniqueConstraint(fields=["user1", "user2"], name="uniq_friendship_pair"),
        ]

    def __str__(self):
        if hasattr(self.user1, "page"):
            sender = f"Page: {self.user1.page.page_full_name}"
        else:
            sender = self.user1.username if self.user1 else f"User {self.user1_id}"

        if hasattr(self.user2, "page"):
            receiver = f"Page: {self.user2.page.page_full_name}"
        else:
            receiver = self.user2.username if self.user2 else f"User {self.user2_id}"

        return f"[{self.get_relation_type_display()}] {sender} -> {receiver} ({self.get_status_display()})"


class Community(models.Model):
    community_id = models.BigAutoField(primary_key=True, db_column="community_id")

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owned_communities",
        db_column="owner_id",
    )

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

    requires_post_approval = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    banner_image = models.ImageField(upload_to="banners/", blank=True, null=True)
    verified = models.BooleanField(default=False)

    can_pages_post = models.BooleanField(default=True, db_column="can_pages_post")
    can_instructors_post = models.BooleanField(default=True, db_column="can_instructors_post")
    can_students_post = models.BooleanField(default=True, db_column="can_students_post")

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
        BLOCKED = "blocked", "Blocked"

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )

    joined_at = models.DateTimeField(auto_now_add=True)
    is_muted = models.BooleanField(default=False)

    class Meta:
        db_table = "community_member"
        constraints = [
            models.UniqueConstraint(fields=["community", "user"], name="uniq_community_user"),
        ]

    def __str__(self):
        community_name = self.community.name if self.community else f"Community {self.community_id}"
        username = self.user.username if self.user else f"User {self.user_id}"
        return f"{community_name} - {username} ({self.get_role_display()})"


class CommunityRequest(models.Model):
    class Privacy(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    request_id = models.BigAutoField(primary_key=True, db_column="request_id")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_requests", db_column="user_id"
    )

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    privacy = models.CharField(
        max_length=10,
        choices=Privacy.choices,
        default=Privacy.PUBLIC,
    )

    purpose_statement = models.TextField(db_column="purpose_statement")

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    rejection_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "community_request"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                condition=models.Q(status="pending"),
                name="uniq_pending_community_request_per_user",
            )
        ]

    def __str__(self):
        return f"Request by {self.user.username}: {self.name} ({self.get_status_display()})"


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

    def __str__(self):
        page_name = self.page.page_full_name if self.page else f"Page {self.page_id}"
        return f"Event: {self.title} by {page_name}"


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

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        event_title = self.event.title if self.event else f"Event {self.event_id}"
        return f"Reminder for {username} - {event_title}"


class Post(models.Model):
    post_id = models.BigAutoField(primary_key=True, db_column="post_id")
    title = models.CharField(max_length=255, null=True, blank=True)
    content_text = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class PostType(models.TextChoices):
        ANNOUNCEMENT = "announcement", "Announcement"
        ADVERTISEMENT = "advertisement", "Advertisement"
        ACADEMY = "academy", "Academy"
        NORMAL = "normal", "Normal"

    post_type = models.CharField(
        max_length=20,
        choices=PostType.choices,
        default=PostType.NORMAL,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    end_at = models.DateTimeField(null=True, blank=True)
    is_approved = models.BooleanField(default=False)
    is_highlighted = models.BooleanField(default=False)
    highlighted_at = models.DateTimeField(null=True, blank=True)
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

    def __str__(self):
        author_name = self.author.username if self.author else "Deleted User"
        snippet = f": {self.content_text[:30]}..." if self.content_text else ""
        return f"Post #{self.post_id} by {author_name}{snippet}"


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

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        return f"{username} saved Post #{self.post_id}"


class PostAdReaction(models.Model):
    class FeedbackType(models.TextChoices):
        GOOD = "good", "Good"
        NEUTRAL = "neutral", "Neutral"
        BAD = "bad", "Bad"

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="ad_reactions", db_column="post_id")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ad_reactions", db_column="user_id"
    )
    reaction_type = models.CharField(max_length=10, choices=FeedbackType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "post_ad_reaction"
        constraints = [
            models.UniqueConstraint(fields=["post", "user"], name="uniq_post_user_ad_reaction"),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.post_id} ({self.reaction_type})"


class PostMedia(models.Model):
    media_id = models.BigAutoField(primary_key=True, db_column="media_id")

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="media", db_column="post_id")

    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"
        AUDIO = "audio", "Audio"
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

    def __str__(self):
        return f"Media #{self.media_id} ({self.get_media_type_display()}) for Post #{self.post_id}"


class PollOption(models.Model):
    id = models.BigAutoField(primary_key=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="poll_options", db_column="post_id")
    text = models.CharField(max_length=255)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "poll_option"
        ordering = ["order_index"]

    def __str__(self):
        return f"Option '{self.text}' for Post #{self.post_id}"


class PollVote(models.Model):
    id = models.BigAutoField(primary_key=True)
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name="votes", db_column="option_id")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="poll_votes", db_column="user_id"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "poll_vote"
        constraints = [
            models.UniqueConstraint(fields=["user", "option"], name="uniq_user_poll_option"),
        ]

    def __str__(self):
        return f"{self.user.username} voted for option #{self.option_id}"


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

    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "comment"

    def __str__(self):
        author_name = self.author.username if self.author else "Deleted User"
        snippet = self.content[:30] + "..." if len(self.content) > 30 else self.content
        prefix = "Reply" if self.parent_comment_id else "Comment"
        return f"{prefix} by {author_name}: {snippet}"


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

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        return f"{username} reacted to Post #{self.post_id}"


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

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        return f"{username} reacted to Comment #{self.comment_id}"


class Conversation(models.Model):
    conversation_id = models.BigAutoField(primary_key=True, db_column="conversation_id")

    class Status(models.TextChoices):
        PENDING = "pending", "Pending Request"
        ACCEPTED = "accepted", "Accepted"

    name = models.CharField("conversation name", max_length=100, blank=True, null=True)
    image = models.ImageField("conversation image", upload_to="conversation_images", blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_group = models.BooleanField(default=False)
    is_private = models.BooleanField(default=False)
    is_academic = models.BooleanField(default=False)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACCEPTED,
    )

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

    allow_members_to_edit_settings = models.BooleanField(
        default=True,
    )

    allow_members_to_send_messages = models.BooleanField(
        default=True,
    )

    allow_members_to_add_others = models.BooleanField(
        default=True,
    )

    def clean(self):
        if not self.created_by:
            raise ValidationError("Conversation must have a creator.")

    class Meta:
        db_table = "conversation"

    def __str__(self):
        if self.is_group:
            return f"Group Chat: {self.name or f'Group #{self.conversation_id}'}"
        initiator = self.created_by.username if self.created_by else f"User {self.created_by_id}"

        other_member_record = (
            ConversationMember.objects.filter(conversation_id=self.conversation_id)
            .exclude(user_id=self.created_by_id)
            .first()
        )

        if other_member_record and other_member_record.user:
            other_member = other_member_record.user.username
        else:
            other_member = "Unknown User"

        return f"Direct Chat: {initiator} - {other_member}"


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
    left_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.conversation.is_group and hasattr(self.user, "page"):
            raise ValidationError("Pages cannot join group conversations.")

        qs = ConversationMember.objects.filter(conversation_id=self.conversation_id)

        if self.user_id is not None:
            qs = qs.filter(user_id=self.user_id)

        if self.pk:
            qs = qs.exclude(pk=self.pk)

        if qs.exists():
            raise ValidationError("Duplicate member.")

    def save(self, *args, **kwargs):
        self.full_clean()
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

    def __str__(self):
        username = self.user.username if self.user else f"Deleted User (ID: {self.user_id})"
        if not self.conversation.is_group:
            other_member = (
                ConversationMember.objects.filter(conversation_id=self.conversation_id)
                .exclude(user_id=self.user_id)
                .first()
            )

            if other_member and other_member.user:
                return f"DM with {other_member.user.username} (Self: {username})"
            return f"DM with Yourself ({username})"

        chat_title = self.conversation.name or f"Group #{self.conversation_id}"
        return f"{chat_title} Member: {username} ({self.get_role_display()})"


class Message(models.Model):
    message_id = models.BigAutoField(primary_key=True, db_column="message_id")

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
        db_column="conversation_id",
    )

    content = models.TextField(blank=True, null=True)
    is_forwarded = models.BooleanField(default=False)
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

    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.pk:
            original = Message.objects.get(pk=self.pk)
            if original.content != self.content:
                self.is_edited = True
                self.edited_at = timezone.now()

        self.full_clean()
        super().save(*args, **kwargs)

        if self.conversation.last_message_id != self.message_id:
            Conversation.objects.filter(pk=self.conversation_id).update(last_message=self)

    class Meta:
        db_table = "message"
        ordering = ["sent_at"]
        indexes = [
            models.Index(fields=["conversation", "-sent_at"]),
        ]

    def __str__(self):
        sender_name = self.sender.username if self.sender else "System"
        if self.conversation.is_group:
            group_name = self.conversation.name or f"Group #{self.conversation.conversation_id}"
            destination = f"Group '{group_name}'"
        else:
            destination = f"DM Chat ({self.conversation.conversation_id})"

        edited_suffix = " [Edited]" if self.is_edited else ""
        snippet = f": {self.content[:25]}..." if self.content else " [Media/Shared Content]"

        return f"{sender_name} in {destination}{snippet}{edited_suffix}"


class MessageMedia(models.Model):
    media_id = models.BigAutoField(primary_key=True, db_column="media_id")

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="media", db_column="message_id")

    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"
        AUDIO = "audio", "Audio"
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

    def __str__(self):
        return f"Media #{self.media_id} ({self.get_media_type_display()}) for Msg #{self.message_id}"


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

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        return f"{username} reacted {self.message_reaction_type} to Msg #{self.message_id}"


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
        DISMISSED = "dismissed", "Dismissed / False Alarm"

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

    def __str__(self):
        reporter_name = self.reporter.username if self.reporter else "Anonymous"
        return f"Report #{self.report_id} by {reporter_name} [{self.get_content_type_display()}]"


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

    type = models.CharField(max_length=50, null=False, blank=False)

    content = models.TextField()

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
        receiver_name = self.receiver.username if self.receiver else f"User {self.receiver_id}"
        status = "Read" if self.is_read else "Unread"
        return f"Notif for {receiver_name}: {self.type} ({status})"


class NotificationSetting(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_settings",
        db_column="user_id",
    )

    enable_all = models.BooleanField(default=True)
    friend_request = models.BooleanField(default=True)
    post_reacted = models.BooleanField(default=True)
    post_commented = models.BooleanField(default=True)
    comment_replied = models.BooleanField(default=True)

    community_new_post = models.BooleanField(default=True)
    community_join_request_status = models.BooleanField(default=True)

    new_event = models.BooleanField(default=True)
    event_updated_cancelled = models.BooleanField(default=True)

    page_announcement = models.BooleanField(default=True)

    dm_existing_chat = models.BooleanField(default=True)
    dm_new_request = models.BooleanField(default=True)
    group_chat = models.BooleanField(default=True)

    password_changed = models.BooleanField(default=True)
    email_updated = models.BooleanField(default=True)

    class Meta:
        db_table = "user_notification_setting"

    def __str__(self):
        username = self.user.username if self.user else f"User {self.user_id}"
        return f"Notification Settings for {username}"


class Promotion(models.Model):
    promotion_id = models.BigAutoField(primary_key=True, db_column="promotion_id")

    content_type_obj = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        db_column="content_type_id",
    )
    object_id = models.PositiveBigIntegerField()
    promoted_content = GenericForeignKey("content_type_obj", "object_id")

    promoted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="promotions",
        db_column="promoted_by_id",
    )

    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()

    duration = models.CharField(max_length=20, blank=True, default="")
    duration_idx = models.PositiveSmallIntegerField(default=2)
    cost = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)

    class Status(models.TextChoices):
        ONHOLD = "ONHOLD", "ONHOLD"
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    class Meta:
        db_table = "promotion"

    def __str__(self):
        content_type = self.content_type_obj.name if self.content_type_obj else "Unknown"
        return f"{self.promoted_by.username} promoted {content_type}"


class NewsItem(models.Model):
    news_id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to="news_banners/")
    link = models.URLField(blank=True, null=True)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "news_item"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[News] {self.title}"


class ContactTicket(models.Model):
    ticket_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contact_tickets",
        db_column="user_id",
    )
    subject = models.CharField(max_length=255)
    message = models.TextField()
    screenshot = models.ImageField(upload_to="support/tickets/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "contact_ticket"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Ticket {self.user.username}: {self.subject[:30]}"


class BugReport(models.Model):
    bug_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bug_reports",
        db_column="user_id",
    )
    message = models.TextField()
    action_track = models.TextField()
    screenshot = models.ImageField(upload_to="support/bugs/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bug_report"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Bug {self.user.username}"
