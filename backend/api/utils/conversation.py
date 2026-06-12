from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, ValidationError

from ..models import Conversation, ConversationMember, Friendship
from .blocked_users import is_blocked
from .notifications import send_global_notification


def get_or_create_direct_conversation(current_user, target_user):
    """
    Safely retrieves or establishes a 1-to-1 direct conversation between two users,
    supporting standard users and institutional page profiles dynamically.
    """
    if current_user == target_user:
        raise ValidationError("You cannot start a chat context with yourself.")

    existing_dm = (
        Conversation.objects.filter(is_group=False, members__user=current_user)
        .filter(members__user=target_user)
        .first()
    )
    if existing_dm:
        return existing_dm, False

    if is_blocked(current_user, target_user):
        raise PermissionDenied("You cannot start a chat context with this profile due to restrictions.")

    is_current_a_page = hasattr(current_user, "page")
    is_target_a_page = hasattr(target_user, "page")

    if is_target_a_page:
        if is_current_a_page:
            relation_needed = Friendship.RelationType.PAGE_TO_PAGE
            is_connected = Friendship.objects.filter(
                (Q(user1=current_user, user2=target_user) | Q(user1=target_user, user2=current_user)),
                status=Friendship.Status.FOLLOWING,
                relation_type=relation_needed,
            ).exists()
        else:
            relation_needed = Friendship.RelationType.USER_TO_PAGE
            is_connected = Friendship.objects.filter(
                user1=current_user, user2=target_user, status=Friendship.Status.FOLLOWING, relation_type=relation_needed
            ).exists()

        # If your page model has custom messaging restrictions, check them here.
        # Otherwise, if it's a page, you can choose to allow messaging freely or restrict by follow/connection:
        if not is_connected:
            raise PermissionDenied("You must follow or be connected to this page to message them.")

    else:
        # --- TARGET IS A STANDARD USER ---
        profile = getattr(target_user, "profile", None)
        if not profile:
            raise ValidationError("Target user does not have an active profile.")

        privacy_setting = getattr(profile, "message_privacy", "EVERYONE")

        if privacy_setting == "NOBODY":
            raise PermissionDenied("This user does not allow new conversations.")

        elif privacy_setting == "FRIENDS_ONLY":
            if is_current_a_page:
                is_mutual = Friendship.objects.filter(
                    user1=target_user,
                    user2=current_user,
                    status=Friendship.Status.FOLLOWING,
                    relation_type=Friendship.RelationType.USER_TO_PAGE,
                ).exists()
            else:
                # user to user
                is_mutual = Friendship.objects.filter(
                    (Q(user1=current_user, user2=target_user) | Q(user1=target_user, user2=current_user)),
                    status=Friendship.Status.ACCEPTED,
                    relation_type=Friendship.RelationType.USER_TO_USER,
                ).exists()

            if not is_mutual:
                raise PermissionDenied("You do not have permission to message this profile.")

    with transaction.atomic():
        new_conv = Conversation.objects.create(is_group=False, created_by=current_user)
        ConversationMember.objects.create(conversation=new_conv, user=current_user)
        ConversationMember.objects.create(conversation=new_conv, user=target_user)

        # Notify recipient unless it's a page (or customize page notification logic)
        if not is_target_a_page:
            send_global_notification(
                sender=current_user,
                receiver=target_user,
                notification_type="dm-request",
                target_object=new_conv,
                custom_text=f"{current_user.username} wants to start a conversation with you.",
            )

    return new_conv, True
