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
    Helper to look up the university page linked to a student or instructor.
    Uses select_related where appropriate to keep queries efficient.
    """
    student = getattr(user, "student_profile", None)
    if student and student.university_page:
        return student.university_page

    instructor = getattr(user, "instructor_profile", None)
    if instructor and instructor.university_page:
        return instructor.university_page

    return None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_info(request):
    university_page = get_user_university(request.user)

    if not university_page:
        return Response({"error": "No university found for this user"}, status=404)

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
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_news(request):
    university_page = get_user_university(request.user)
    if not university_page:
        return Response([])

    posts = Post.objects.filter(
        author=university_page.user,
        post_type="announcement",
    ).order_by("-created_at")

    news_data = []
    for post in posts:
        image = None
        if hasattr(post, "media"):
            first_media = post.media.filter(media_type="image").first()
            if first_media:
                image = file_url(request, first_media.media_file)

        news_data.append(
            {
                "id": post.post_id,
                "title": getattr(post, "title", "") or "",
                "desc": post.content_text[:200] if getattr(post, "content_text", None) else "",
                "date": post.created_at.strftime("%B %d, %Y"),
                "img": image or "/default-news.jpg",
            }
        )

    return Response(news_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_events(request):
    university_page = get_user_university(request.user)
    if not university_page:
        return Response([])

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

    return Response(events_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_doctors(request):
    university_page = get_user_university(request.user)
    if not university_page:
        return Response([])

    # Reaching through Instructor -> User -> UserProfile matching your new models
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

        # Uses your model's AcademicTitle choices safely
        title_display = instructor.get_academic_title_display() if instructor.academic_title else ""
        full_name = f"{title_display} {raw_name}".strip()

        doctors_data.append(
            {
                "id": user_obj.id,
                "username": user_obj.username,
                "name": full_name,
                "desc": instructor.department or "Faculty Member",
                "tag": instructor.get_instructor_type_display() if instructor.instructor_type else None,
                "avatar": file_url(request, profile.profile_image) if profile and profile.profile_image else None,
            }
        )

    return Response(doctors_data)
