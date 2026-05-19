from django.contrib.contenttypes.models import ContentType

from ..models import Notification, NotificationSetting


def should_send_notification(recipient, notification_type):
    if not recipient:
        return False

    if notification_type == "university_announcement":
        return True

    settings_profile, _ = NotificationSetting.objects.get_or_create(user=recipient)

    if not settings_profile.enable_all:
        return False

    toggle_mapping = {
        # friend
        "friend_request": settings_profile.friend_request,
        "friend_accepted": settings_profile.friend_request,
        # post
        "post_reaction": settings_profile.post_reacted,
        "post_comment": settings_profile.post_commented,
        "comment_reply": settings_profile.comment_replied,
        "community_post": settings_profile.community_new_post,
        "page_announcement": settings_profile.page_announcement,
        # community
        "community_join_status": settings_profile.community_join_request_status,
        # event
        "new_event": settings_profile.new_event,
        "event_update": settings_profile.event_updated_cancelled,
        # chat
        "dm_existing": settings_profile.dm_existing_chat,
        "dm_request": settings_profile.dm_new_request,
        "group_chat": settings_profile.group_chat,
        # other
        "security_password": settings_profile.password_changed,
        "security_email": settings_profile.email_updated,
    }

    return toggle_mapping.get(notification_type, True)


def send_global_notification(sender, receiver, notification_type, target_object, custom_text=None):
    """
    The Single Central Handler for the entire application.

    :param sender: The user who did the action (actor)
    :param receiver: The user receiving the alert
    :param notification_type: The structural key (e.g., 'post_comment', 'friend_request')
    :param target_object: The actual model instance (Comment, Post, Friendship, etc.)
    :param custom_text: Optional override text if you want specific wording
    """
    if sender and receiver and sender == receiver:
        return None

    if not should_send_notification(receiver, notification_type):
        return None

    text_templates = {
        "friend_request": f"{sender.username} sent you a friend request.",
        "friend_accepted": f"{sender.username} accepted your friend request.",
        "post_reaction": f"{sender.username} reacted to your post.",
        "post_comment": f"{sender.username} commented on your post.",
        "comment_reply": f"{sender.username} replied to your comment.",
        "community_post": "New post available in a community you follow.",
        "community_join_status": "Your community join request status updated.",
        "page_announcement": "New announcement from a Page you follow.",
    }

    notification_content = custom_text or text_templates.get(
        notification_type, f"New interaction from {sender.username if sender else 'System'}."
    )

    type_mapping = {
        "friend_request": Notification.Type.FRIEND_REQUEST,
        "friend_accepted": Notification.Type.ACCEPTED_FRIEND_REQUEST,
        "post_comment": Notification.Type.COMMENT,
        "comment_reply": Notification.Type.COMMENT,
        "dm_existing": Notification.Type.MESSAGE,
        "dm_request": Notification.Type.MESSAGE,
        "group_chat": Notification.Type.MESSAGE,
        "community_join_status": Notification.Type.SYSTEM,
    }
    db_notification_type = type_mapping.get(notification_type, Notification.Type.COMMENT)

    return Notification.objects.create(
        receiver=receiver,
        actor=sender,
        type=db_notification_type,
        content=notification_content,
        content_type=ContentType.objects.get_for_model(target_object),
        object_id=target_object.pk,
    )
