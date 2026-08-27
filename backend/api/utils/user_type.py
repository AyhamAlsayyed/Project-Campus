def get_user_type(user):
    """
    Determine if a user is a person (has UserProfile) or a page (has Page)

    Returns:
        str: "user", "page", or "unknown"
    """
    if not user or not user.is_authenticated:
        return "unknown"

    # Check if user has a page
    if hasattr(user, "page") and user.page_profile:
        return "page"

    # Check if user has a user profile (person)
    if hasattr(user, "profile") and user.profile:
        return "user"

    return "unknown"


def is_page_user(user):
    """Check if user is a page"""
    return get_user_type(user) == "page"


def is_person_user(user):
    """Check if user is a person"""
    return get_user_type(user) == "person"


def get_user_display_name(user):
    """Get the display name based on user type"""
    if is_page_user(user):
        page = user.page_profile
        return page.page_full_name or page.page_name or user.username
    elif is_person_user(user):
        profile = user.profile
        return profile.full_name or user.username
    else:
        return user.username


def get_user_avatar(request, user):
    if not user:
        return None

    profile = getattr(user, "profile", None)
    if profile and profile.profile_image:
        return request.build_absolute_uri(profile.profile_image.url)

    page = getattr(user, "page", None)
    if page and page.profile_image:
        return request.build_absolute_uri(page.profile_image.url)

    return None
