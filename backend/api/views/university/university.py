from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Event, Instructor, Post


def file_url(request, f):
    if not f:
        return None
    try:
        return request.build_absolute_uri(f.url)
    except Exception:
        return None


def get_user_university(user):
    """
    Finds the relevant university page context.
    Supports University page owners, students, and instructors.
    """
    page = getattr(user, "page", None)
    if page and getattr(page, "page_type", None) == "university":
        return page

    student = getattr(user, "student_profile", None)
    if student and student.university_page:
        return student.university_page

    instructor = getattr(user, "instructor_profile", None)
    if instructor and instructor.university_page:
        return instructor.university_page

    return None


def calculate_extended_date(base_datetime, duration_str):
    """
    Adds the requested duration offset string to a base datetime object.
    """
    normalized_key = str(duration_str).lower().strip()

    offsets = {
        "1 week": timedelta(weeks=1),
        "1 month": timedelta(days=30),
        "3 months": timedelta(days=90),
        "6 months": timedelta(days=180),
        "1 year": timedelta(days=365),
    }

    target_offset = offsets.get(normalized_key, timedelta(days=30))
    return base_datetime + target_offset


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_info(request):
    university_page = get_user_university(request.user)

    if not university_page:
        return Response({"error": "No university found for this user"}, status=status.HTTP_404_NOT_FOUND)

    students_count = university_page.students.count()
    instructors_count = university_page.instructors.count()

    posts_count = Post.objects.filter(author=university_page.user).count()
    events_count = Event.objects.filter(page=university_page).count()

    return Response(
        {
            "id": university_page.id if hasattr(university_page, "id") else getattr(university_page, "page_id", None),
            "page_id": university_page.user_id,
            "university_handle": university_page.user.username if university_page.user else None,
            "name": university_page.page_full_name,
            "name_arabic": university_page.page_name_arabic or "",
            "description": university_page.description,
            "logo": file_url(request, university_page.profile_image),
            "banner": file_url(request, university_page.banner_image),
            "verified": university_page.verified,
            "branch": university_page.page_branch or "",
            "stats": {
                "students": students_count,
                "instructors": instructors_count,
                "posts": posts_count,
                "events": events_count,
            },
            "created_at": university_page.created_at.isoformat(),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_news(request):
    university_page = get_user_university(request.user)
    if not university_page:
        return Response([], status=status.HTTP_403_FORBIDDEN)

    current_time = timezone.now()
    posts = (
        Post.objects.filter(
            author=university_page.user,
            post_type=Post.PostType.ANNOUNCEMENT,
        )
        .filter(Q(end_at__gt=current_time) | Q(end_at__isnull=True))
        .order_by("-created_at")
    )

    news_data = []
    for post in posts:
        image = None
        if hasattr(post, "media"):
            first_media = post.media.filter(media_type="image").first()
            if first_media:
                image = file_url(request, first_media.media_file)

        if post.end_at:
            time_difference = post.end_at - current_time
            days_remaining = time_difference.days

            if time_difference.total_seconds() < 0:
                status_message = "Expired"
                days_left_value = 0
            elif days_remaining == 0:
                status_message = "Expires today"
                days_left_value = 0
            elif days_remaining == 1:
                status_message = "Expires tomorrow"
                days_left_value = 1
            else:
                status_message = f"{days_remaining} days left"
                days_left_value = days_remaining
        else:
            status_message = "Permanent"
            days_left_value = None

        news_data.append(
            {
                "id": post.post_id,
                "title": getattr(post, "title", "") or "",
                "desc": post.content_text[:200] if getattr(post, "content_text", None) else "",
                "date": post.end_at.strftime("%B %d, %Y") if post.end_at else post.created_at.strftime("%B %d, %Y"),
                "img": image or "/default-news.jpg",
                "days_left": days_left_value,
                "status_message": status_message,
            }
        )

    return Response(news_data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_events(request):
    university_page = get_user_university(request.user)
    if not university_page:
        return Response(status=status.HTTP_403_FORBIDDEN)

    events = Event.objects.filter(page=university_page).order_by("start_date")[:10]

    events_data = []
    for event in events:
        events_data.append(
            {
                "id": event.event_id,
                "title": event.title,
                "desc": event.description[:150] if event.description else "",
                "date": event.start_date.strftime("%B %d, %Y at %I:%M %p"),
                "location": event.location,
                "img": file_url(request, event.image)
                or file_url(request, university_page.banner_image)
                or "/default-event.jpg",
            }
        )

    return Response(events_data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_doctors(request):
    university_page = get_user_university(request.user)
    if not university_page:
        return Response(status=status.HTTP_403_FORBIDDEN)

    instructors = (
        Instructor.objects.filter(university_page=university_page)
        .select_related("user", "user__profile")
        .order_by("user__username")
    )

    doctors_data = []
    for instructor in instructors:
        user_obj = instructor.user
        profile = getattr(user_obj, "profile", None)

        raw_name = profile.full_name if profile and profile.full_name else user_obj.username

        display_method = getattr(instructor, "get_academic_title_display", None)
        title_display = display_method() if display_method and instructor.academic_title else ""
        full_name = f"{title_display} {raw_name}".strip()

        doctors_data.append(
            {
                "id": user_obj.id,
                "username": user_obj.username,
                "name": full_name,
                "desc": instructor.department or "Faculty Member",
                "tag": title_display,
                "avatar": file_url(request, profile.profile_image) if profile and profile.profile_image else None,
            }
        )

    return Response(doctors_data, status=status.HTTP_200_OK)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def extend_announcement(request, post_id):
    """
    Extends the 'end_at' expiration lifespan of a university announcement.
    """
    duration_input = request.data.get("extend_by")
    if not duration_input:
        return Response(
            {"error": "The field 'extend_by' (e.g., '3 months') is required to extend the post."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        try:
            post = Post.objects.select_for_update().get(post_id=post_id, post_type=Post.PostType.ANNOUNCEMENT)
        except Post.DoesNotExist:
            return Response(
                {"error": "Announcement post not found or it is not an announcement type."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if post.author != request.user:
            return Response(
                {"error": "You do not have permission to extend this announcement."}, status=status.HTTP_403_FORBIDDEN
            )

        current_time = timezone.now()

        if post.end_at and post.end_at > current_time:
            base_date = post.end_at
        else:
            base_date = current_time

        post.end_at = calculate_extended_date(base_date, duration_input)
        post.save(update_fields=["end_at"])

    return Response(
        {
            "status": "success",
            "message": "Announcement extended successfully!",
            "post_id": post.post_id,
            "extend_by": duration_input,
            "new_end_date": post.end_at.strftime("%A - %d/%m/%Y"),
            "is_active": post.end_at > current_time,
        },
        status=status.HTTP_200_OK,
    )
