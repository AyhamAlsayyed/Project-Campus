import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.apps import apps
from django.utils.timezone import now


class StatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.status_group = "user_status_updates"
        await self.channel_layer.group_add(self.status_group, self.channel_name)

        await self.accept()

        await self.update_user_status("online")
        await self.broadcast_status_change("online")

    async def disconnect(self, close_code):
        if not self.user.is_anonymous:
            await self.channel_layer.group_discard(self.status_group, self.channel_name)

            await self.update_user_status("offline")
            await self.broadcast_status_change("offline")

    async def receive(self, text_data):
        """Handles manual visibility toggles sent by the Frontend client"""
        try:
            data = json.loads(text_data)
            requested_status = data.get("status")

            UserProfile = apps.get_model("api", "UserProfile")
            valid_statuses = [choice[0] for choice in UserProfile.Status.choices]

            if requested_status in valid_statuses:
                await self.update_user_status(requested_status)
                await self.broadcast_status_change(requested_status)
            else:
                await self.send(
                    text_data=json.dumps({"error": f"Invalid status options. Choose from: {valid_statuses}"})
                )
        except Exception:
            await self.send(text_data=json.dumps({"error": "Invalid payload format."}))

    @database_sync_to_async
    def update_user_status(self, new_status):
        """Safely accesses the thread-locked Django ORM layer via sync-to-async wrapper"""
        UserProfile = apps.get_model("api", "UserProfile")
        try:
            profile = UserProfile.objects.get(user=self.user)
            profile.status = new_status
            profile.save(update_fields=["status"])
        except UserProfile.DoesNotExist:
            UserProfile.objects.create(user=self.user, status=new_status)

    async def broadcast_status_change(self, current_status):
        """Dispatches an inter-process message bundle into the redis channel layer"""
        await self.channel_layer.group_send(
            self.status_group,
            {
                "type": "status_message",
                "user_id": self.user.id,
                "username": self.user.username,
                "status": current_status,
            },
        )

    async def status_message(self, event):
        """Catchment container that serializes and ships the broadcast payload out"""
        await self.send(
            text_data=json.dumps(
                {"user_id": event["user_id"], "username": event["username"], "status": event["status"]}
            )
        )


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"

        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        is_member = await self.check_membership(self.conversation_id, self.user)
        if not is_member:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.update_last_read(self.conversation_id, self.user)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        """Handles incoming new text messages or reactions sent from the frontend client"""
        try:
            data = json.loads(text_data)
            action_type = data.get("action", "message")

            if action_type == "message":
                content = data.get("content", "").strip()
                parent_message_id = data.get("parent_message_id", None)
                shared_post_id = data.get("shared_post_id", None)

                if not content and not shared_post_id:
                    return
                message_data = await self.save_message(
                    conversation_id=self.conversation_id,
                    sender=self.user,
                    content=content,
                    parent_id=parent_message_id,
                    post_id=shared_post_id,
                )

                await self.channel_layer.group_send(self.room_group_name, {"type": "chat_message", **message_data})

            elif action_type == "reaction":
                message_id = data.get("message_id")
                reaction_type = data.get("reaction_type", "").strip()

                if message_id and reaction_type:
                    reaction_data = await self.handle_reaction(message_id, self.user, reaction_type)
                    if reaction_data:
                        await self.channel_layer.group_send(
                            self.room_group_name, {"type": "chat_reaction", **reaction_data}
                        )

        except Exception:
            await self.send(text_data=json.dumps({"error": "Failed to parse message string format."}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def chat_reaction(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def check_membership(self, conversation_id, user):
        ConversationMember = apps.get_model("api", "ConversationMember")
        return ConversationMember.objects.filter(conversation_id=conversation_id, user=user).exists()

    @database_sync_to_async
    def update_last_read(self, conversation_id, user):
        ConversationMember = apps.get_model("api", "ConversationMember")
        ConversationMember.objects.filter(conversation_id=conversation_id, user=user).update(last_read_at=now())

    @database_sync_to_async
    def save_message(self, conversation_id, sender, content, parent_id, post_id):
        Message = apps.get_model("api", "Message")

        msg = Message.objects.create(
            conversation_id=conversation_id,
            sender=sender,
            content=content,
            parent_message_id=parent_id,
            shared_post_id=post_id,
        )

        ConversationMember = apps.get_model("api", "ConversationMember")
        ConversationMember.objects.filter(conversation_id=conversation_id, user=sender).update(last_read_at=msg.sent_at)

        return {
            "message_id": msg.message_id,
            "conversation_id": int(conversation_id),
            "sender_id": sender.id,
            "username": sender.username,
            "content": msg.content,
            "parent_message_id": msg.parent_message_id,
            "shared_post_id": msg.shared_post_id,
            "sent_at": msg.sent_at.isoformat(),
        }

    @database_sync_to_async
    def handle_reaction(self, message_id, user, reaction_type):
        MessageReaction = apps.get_model("api", "MessageReaction")

        existing = MessageReaction.objects.filter(message_id=message_id, user=user, message_reaction_type=reaction_type)

        if existing.exists():
            existing.delete()
            action = "removed"
        else:
            MessageReaction.objects.create(message_id=message_id, user=user, message_reaction_type=reaction_type)
            action = "added"

        return {
            "message_id": message_id,
            "user_id": user.id,
            "username": user.username,
            "reaction_type": reaction_type,
            "action": action,
        }


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.notification_group_name = f"user_notifications_{self.user.id}"

        await self.channel_layer.group_add(self.notification_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "notification_group_name"):
            await self.channel_layer.group_discard(self.notification_group_name, self.channel_name)

    async def receive(self, text_data):
        """
        WebSockets are 2-way, but notifications are almost always 1-way (Server -> Client).
        However, if the frontend wants to send a "Mark as Read" event down the socket,
        you can process it here.
        """
        try:
            data = json.loads(text_data)
            action = data.get("action")

            if action == "mark_all_read":
                pass
        except Exception:
            pass

    async def send_notification(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "id": event.get("id"),
                    "notification_type": event.get("notification_type"),
                    "title": event.get("title"),
                    "description": event.get("description"),
                    "created_at": event.get("created_at"),
                    "extra_data": event.get("extra_data", {}),
                }
            )
        )
