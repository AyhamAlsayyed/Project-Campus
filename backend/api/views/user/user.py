from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Friendship


def get_user_academic_info(user):
    result = {}

    student = getattr(user, "student_profile", None)
    if student:
        result["role"] = "student"
        result["major"] = student.major
        result["academic"] = student.academic_level
        result["university_page_name"] = student.university_page.page_name if student.university_page else None
        return result

    instructor = getattr(user, "instructor_profile", None)
    if instructor:
        result["role"] = "instructor"
        result["department"] = instructor.department
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
            "bio": getattr(profile, "bio", ""),
            "avatar": avatar,
            "cover": cover,
            "university": user_info.get("university_page_name"),
            "major": user_info.get("major"),
            "role": user_info.get("role"),
        },
        status=status.HTTP_200_OK,
    )


User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile_view(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    profile = getattr(user, "profile", None)

    avatar = None
    if profile and profile.profile_image:
        avatar = request.build_absolute_uri(profile.profile_image.url)

    cover = None
    if profile and profile.banner_image:
        cover = request.build_absolute_uri(profile.banner_image.url)

    # academic info
    student = getattr(user, "student_profile", None)
    instructor = getattr(user, "instructor_profile", None)
    admin = getattr(user, "admin_profile", None)

    if student:
        university = student.university_page.page_name if student.university_page else None
        major = student.major
        role = "student"
    elif instructor:
        university = instructor.university_page.page_name if instructor.university_page else None
        major = None
        role = "instructor"

        instructor_data = {
            "academic_title": instructor.academic_title,
            "department": instructor.department,
            "instructor_type": instructor.instructor_type,
            "university_page": university,
        }
    elif admin:
        university = None
        major = None
        role = "admin"
    else:
        university = None
        major = None
        role = "unknown"

    # friendship status
    current_user = request.user

    if current_user == user:
        friend_status = "self"
    else:
        friendship = Friendship.objects.filter(
            Q(user1=current_user, user2=user) | Q(user1=user, user2=current_user)
        ).first()

        if not friendship:
            friend_status = "none"
        elif friendship.status == Friendship.Status.PENDING:
            friend_status = "sent" if friendship.user1 == current_user else "received"
        elif friendship.status == Friendship.Status.ACCEPTED:
            friend_status = "friends"
        elif friendship.status == Friendship.Status.BLOCKED:
            friend_status = "blocked"
        else:
            friend_status = "none"

    friends_count = Friendship.objects.filter(Q(user1=user) | Q(user2=user), status=Friendship.Status.ACCEPTED).count()

    DEGREE_ORDER = {
        "PhD": 1,
        "Master": 2,
        "Bachelor": 3,
        "Diploma": 4,
    }

    degrees_qs = getattr(user, "degrees", None)
    degrees = []

    if degrees_qs:
        degrees = sorted(
            degrees_qs.all(),
            key=lambda d: DEGREE_ORDER.get(d.degree_type, 99),
        )

        degrees = [
            {
                "id": d.id,
                "degree_type": d.degree_type,
                "major": d.major,
                "institution": d.institution,
            }
            for d in degrees
        ]

    response_data = {
        "id": user.id,
        "username": user.username,
        "full_name": getattr(profile, "full_name", ""),
        "academic_email": getattr(profile, "academic_email", ""),
        "bio": getattr(profile, "bio", ""),
        "avatar": avatar,
        "cover": cover,
        "university": university,
        "major": major,
        "role": role,
        "friend_status": friend_status,
        "friends_count": friends_count,
        "email": user.email,
        "primary_phone": getattr(profile, "primary_phone", ""),
        "secondary_phone": getattr(profile, "secondary_phone", ""),
        "degree": degrees,
    }

    if instructor:
        response_data["instructor_info"] = instructor_data

    return Response(response_data, status=status.HTTP_200_OK)
