from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification


@receiver(post_save, sender=Notification)
def push_notification_to_socket(sender, instance, created, **kwargs):
    if not created:
        return

    channel_layer = get_channel_layer()

    actor_avatar = None
    if instance.actor:
        try:
            img = instance.actor.profile.profile_image
            actor_avatar = img.url if img else None
        except Exception:
            pass

    async_to_sync(channel_layer.group_send)(
        f"user_notifications_{instance.receiver.id}",
        {
            "type": "send_notification",
            "id": instance.notification_id,
            "notification_type": instance.type,
            "description": instance.content,        # ← content not message
            "actor_avatar": actor_avatar,
            "actor_id": instance.actor.id if instance.actor else None,
            "created_at": instance.created_at.isoformat(),
            "is_read": False,
            "link": {},
        }
    )