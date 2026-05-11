from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Event, Instructor, Post


def file_url(request, f):
    if not f:
        return None
    if isinstance(f, str):
        return request.build_absolute_uri(f) if f.startswith("/") else f
    try:
        return request.build_absolute_uri(f.url)
    except Exception:
        return None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_info(request):
    user = request.user

    university_page = None
    if hasattr(user, "student_profile") and user.student_profile.university_page:
        university_page = user.student_profile.university_page
    elif hasattr(user, "instructor_profile") and user.instructor_profile.university_page:
        university_page = user.instructor_profile.university_page

    if not university_page:
        return Response({"error": "No university found for this user"}, status=404)

    students_count = university_page.students.count()
    instructors_count = university_page.instructors.count()
    posts_count = Post.objects.filter(author_page=university_page).count()
    events_count = Event.objects.filter(page=university_page).count()

    return Response(
        {
            "id": university_page.page_id,
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
    user = request.user

    university_page = None
    if hasattr(user, "student_profile") and user.student_profile.university_page:
        university_page = user.student_profile.university_page
    elif hasattr(user, "instructor_profile") and user.instructor_profile.university_page:
        university_page = user.instructor_profile.university_page

    if not university_page:
        return Response([])

    posts = (
        Post.objects.filter(author_page=university_page, post_type=Post.PostType.ANNOUNCEMENT)
        .select_related("author_page")
        .prefetch_related("media")
        .order_by("-created_at")[:10]
    )

    news_data = []
    for post in posts:
        image = None
        for media in post.media.all():
            if media.media_type == "image":
                image = file_url(request, media.media_file)
                break

        news_data.append(
            {
                "id": post.post_id,
                "title": post.title if post.title else "",
                "desc": post.content_text[:200] if post.content_text else "",
                "date": post.created_at.strftime("%B %d, %Y"),
                "img": image or "/default-news.jpg",
            }
        )

    return Response(news_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_events(request):
    user = request.user

    university_page = None
    if hasattr(user, "student_profile") and user.student_profile.university_page:
        university_page = user.student_profile.university_page
    elif hasattr(user, "instructor_profile") and user.instructor_profile.university_page:
        university_page = user.instructor_profile.university_page

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
                "img": file_url(request, university_page.banner_image) or "/default-event.jpg",
            }
        )

    return Response(events_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def university_doctors(request):
    user = request.user

    university_page = None
    if hasattr(user, "student_profile") and user.student_profile.university_page:
        university_page = user.student_profile.university_page
    elif hasattr(user, "instructor_profile") and user.instructor_profile.university_page:
        university_page = user.instructor_profile.university_page

    if not university_page:
        return Response([])

    instructors = (
        Instructor.objects.filter(university_page=university_page)
        .select_related("user", "user__profile")
        .order_by("user__username")
    )

    doctors_data = []
    for instructor in instructors:
        user_obj = instructor.user
        profile = getattr(user_obj, "profile", None)

        full_name = getattr(profile, "full_name", "") or user_obj.username

        title_display = dict(Instructor.AcademicTitle.choices).get(instructor.academic_title, "")
        if title_display:
            full_name = f"{title_display} {full_name}"

        doctors_data.append(
            {
                "id": user_obj.id,
                "name": full_name,
                "desc": instructor.department if instructor.department else None,
                "tag": instructor.get_instructor_type_display() if instructor.instructor_type else None,
                "avatar": file_url(request, profile.profile_image) if profile and profile.profile_image else None,
            }
        )

    return Response(doctors_data)
