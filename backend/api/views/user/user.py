import json
import re

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Conversation, EventReminder, Friendship, UserDegree


def get_user_academic_info(user):
    result = {}

    student = getattr(user, "student_profile", None)
    if student:
        result["role"] = "student"
        result["major"] = student.major
        result["academic"] = student.academic_level
        result["university_page_full_name"] = (
            student.university_page.page_full_name if student.university_page else None
        )
        result["university_page_name"] = student.university_page.page_name if student.university_page else None
        return result

    instructor = getattr(user, "instructor_profile", None)
    if instructor:
        result["role"] = "instructor"
        result["department"] = instructor.department
        result["university_page_full_name"] = (
            instructor.university_page.page_full_name if instructor.university_page else None
        )
        result["university_page_name"] = instructor.university_page.page_name if instructor.university_page else None
        return result

    admin = getattr(user, "admin_profile", None)
    if admin:
        result["role"] = "admin"
        return result

    result["role"] = "unknown"
    return result


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    profile = getattr(user, "profile", None)

    avatar = None
    if profile and getattr(profile, "profile_image", None):
        avatar = request.build_absolute_uri(profile.profile_image.url)

    cover = None
    if profile and getattr(profile, "banner_image", None):
        cover = request.build_absolute_uri(profile.banner_image.url)

    user_info = get_user_academic_info(user)
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "full_name": getattr(profile, "full_name", ""),
            "academic_email": getattr(profile, "academic_email", ""),
            "email": user.email,
            "bio": getattr(profile, "bio", ""),
            "avatar": avatar,
            "cover": cover,
            "primary_phone": getattr(profile, "primary_phone", ""),
            "secondary_phone": getattr(profile, "secondary_phone", ""),
            "university": user_info.get("university_page_name"),
            "major": user_info.get("major"),
            "role": user_info.get("role"),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_events(request):
    reminders_qs = EventReminder.objects.filter(user=request.user).select_related("event", "event__page")

    reminders_list = []

    for r in reminders_qs:
        event = r.event
        page = event.page

        reminders_list.append(
            {
                "id": event.event_id,
                "title": event.title,
                "description": event.description,
                "start_date": event.start_date,
                "location": event.location,
                "banner": request.build_absolute_uri(event.image.url) if event.image else None,
                "page": {
                    "name": page.page_full_name,
                    "page_id": page.page_id,
                    "avatar": request.build_absolute_uri(page.profile_image.url) if page.profile_image else None,
                    "is_verified": getattr(page, "verified", False),  # Using getattr as a safety check
                },
            }
        )

    return Response(reminders_list, status=status.HTTP_200_OK)


User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_view(request, user_id):
    try:
        user = (
            User.objects.select_related(
                "profile", "student_profile__university_page", "instructor_profile__university_page", "admin_profile"
            )
            .prefetch_related("degrees")
            .get(id=user_id)
        )
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    current_user = request.user
    profile = getattr(user, "profile", None)

    avatar = request.build_absolute_uri(profile.profile_image.url) if profile and profile.profile_image else None
    cover = request.build_absolute_uri(profile.banner_image.url) if profile and profile.banner_image else None

    student = getattr(user, "student_profile", None)
    instructor = getattr(user, "instructor_profile", None)
    admin = getattr(user, "admin_profile", None)

    university = None
    university_full_name = None
    university_branch = None
    major = ""
    academic_title = ""
    department = ""
    instructor_type = ""
    role = "unknown"
    uni_page = None

    if student:
        role = "student"
        major = student.major
        uni_page = student.university_page
    elif instructor:
        role = "instructor"
        academic_title = instructor.academic_title
        department = instructor.department
        instructor_type = instructor.instructor_type
        uni_page = instructor.university_page
    elif admin:
        role = "admin"

    if uni_page:
        university = uni_page.page_full_name
        university_full_name = uni_page.page_full_name
        university_branch = uni_page.page_branch

    if current_user == user:
        friend_status = "self"
    else:
        friendship = Friendship.objects.filter(
            Q(user1=current_user, user2=user) | Q(user1=user, user2=current_user)
        ).first()

        if not friendship:
            friend_status = "none"
        else:
            status_map = {
                Friendship.Status.PENDING: "sent" if friendship.user1 == current_user else "received",
                Friendship.Status.ACCEPTED: "friends",
                Friendship.Status.BLOCKED: "blocked",
            }
            friend_status = status_map.get(friendship.status, "none")

    friends_count = Friendship.objects.filter(Q(user1=user) | Q(user2=user), status=Friendship.Status.ACCEPTED).count()

    DEGREE_ORDER = {"PhD": 1, "Master": 2, "Bachelor": 3, "Diploma": 4}
    degrees_qs = user.degrees.all()
    degrees = [
        {
            "id": d.id,
            "degree_type": d.degree_type,
            "major": d.major,
            "institution": d.institution,
        }
        for d in sorted(degrees_qs, key=lambda d: DEGREE_ORDER.get(d.degree_type, 99))
    ]

    conversation_id = None
    if current_user.is_authenticated and current_user != user:
        conversation = (
            Conversation.objects.filter(is_group=False, members__user=current_user).filter(members__user=user).first()
        )
        if conversation:
            conversation_id = conversation.conversation_id

    response_data = {
        "id": user.id,
        "username": user.username,
        "full_name": getattr(profile, "full_name", ""),
        "academic_email": getattr(profile, "academic_email", ""),
        "bio": getattr(profile, "bio", ""),
        "avatar": avatar,
        "cover": cover,
        "university": university,
        "university_full_name": university_full_name,
        "university_branch": university_branch,
        "major": major,
        "academic_title": academic_title,
        "department": department,
        "instructor_type": instructor_type,
        "role": role,
        "friend_status": friend_status,
        "friends_count": friends_count,
        "personal_email": user.email,
        "primary_phone": getattr(profile, "primary_phone", ""),
        "secondary_phone": getattr(profile, "secondary_phone", ""),
        "degree": degrees,
        "birthday": getattr(profile, "birth_date", ""),
        "conversation_id": conversation_id,
    }

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    profile = getattr(user, "profile", None)

    username = request.data["username"] if "username" in request.data else None
    if username != user.username:
        username = request.data["username"]
        if not re.fullmatch(r"[a-z]+", username):
            return Response(
                {"message": "Username must contain only lowercase letters"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # enforce username uniqueness
        if User.objects.filter(username__iexact=username).exists():
            return Response({"message": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)
        user.username = request.data["username"]

        if "personal_email" in request.data:
            user.email = request.data["personal_email"]

    if profile:
        if "full_name" in request.data:
            profile.full_name = request.data["full_name"]
        if "bio" in request.data:
            profile.bio = request.data["bio"]
        if "primary_phone" in request.data:
            profile.primary_phone = request.data["primary_phone"]
        if "secondary_phone" in request.data:
            profile.secondary_phone = request.data["secondary_phone"]
        if "personal_email" in request.data:
            profile.secondary_email = request.data.get("personal_email", "")
        if "birth_date" in request.data:
            profile.birth_date = request.data["birth_date"]

        if "avatar" in request.FILES:
            profile.profile_image = request.FILES["avatar"]
        if "cover" in request.FILES:
            profile.banner_image = request.FILES["cover"]

        profile.save()
    print("1")
    print(request.data)
    if "degrees" in request.data:
        print("2")
        try:
            degrees_data = request.data.get("degrees")
            if isinstance(degrees_data, str):
                degrees_data = json.loads(degrees_data)

            existing_degree_ids = set(user.degrees.values_list("id", flat=True))
            provided_degree_ids = []

            for degree_item in degrees_data:
                degree_id = degree_item.get("id")

                if degree_id and int(degree_id) in existing_degree_ids:
                    # update degree
                    dg = UserDegree.objects.get(id=degree_id, user=user)
                    dg.degree_type = degree_item.get("degree_type", dg.degree_type)
                    dg.major = degree_item.get("major", dg.major)
                    dg.institution = degree_item.get("institution", dg.institution)
                    dg.save()
                    provided_degree_ids.append(int(degree_id))
                else:
                    # create new degree
                    new_dg = UserDegree.objects.create(
                        user=user,
                        degree_type=degree_item.get("degree_type"),
                        major=degree_item.get("major", ""),
                        institution=degree_item.get("institution", ""),
                    )
                    provided_degree_ids.append(new_dg.id)
            # delete degree
            UserDegree.objects.filter(user=user).exclude(id__in=provided_degree_ids).delete()

        except Exception as e:
            return Response({"error": f"Failed to update degrees: {str(e)}"}, status=400)

    if hasattr(user, "student_profile") and "major" in request.data:
        user.student_profile.major = request.data["major"]
        user.student_profile.save()

    user.save()

    return Response({"message": "Profile updated successfully"}, status=status.HTTP_200_OK)
