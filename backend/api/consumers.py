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
        self.notification_group_name = f"user_notifications_{self.user.id}"
        print(f"[NotifWS] User {self.user.id} joined group: {self.notification_group_name}")

        await self.accept()

        await self.update_user_status("online")
        await self.broadcast_status_change("online")

        # Send the current online roster to this newly connected client
        online_users = await self.get_online_users()
        for user_id, username, status in online_users:
            if user_id == self.user.id:
                continue  # skip self, already broadcast above
            await self.send(text_data=json.dumps({
                "user_id": user_id,
                "username": username,
                "status": status,
            }))

    async def disconnect(self, close_code):
        if not self.user.is_anonymous:
            await self.channel_layer.group_discard(self.status_group, self.channel_name)
            await self.update_user_status("offline")
            await self.broadcast_status_change("offline")

    async def receive(self, text_data):
        """Handles manual visibility toggles sent by the frontend client"""
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

    @database_sync_to_async
    def get_online_users(self):
        """Fetches all non-offline users from the DB to push to a newly connected client"""
        UserProfile = apps.get_model("api", "UserProfile")
        return list(
            UserProfile.objects
            .exclude(status="offline")
            .select_related("user")
            .values_list("user__id", "user__username", "status")
        )

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

                if shared_post_id and not content:
                    content = "Shared a post"

                if not content and not shared_post_id:
                    return

                # Build base URL from scope for absolute media URLs
                headers = dict(self.scope.get("headers", []))
                host = headers.get(b"host", b"localhost:8000").decode()
                scheme = "https" if self.scope.get("type") == "wss" else "http"
                base_url = f"{scheme}://{host}"

                message_data = await self.save_message(
                    conversation_id=self.conversation_id,
                    sender=self.user,
                    content=content,
                    parent_id=parent_message_id,
                    post_id=shared_post_id,
                    base_url=base_url,
                )

                # Broadcast to everyone in the chat room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "chat_message", **message_data}
                )

                # Notify other members via their personal notification channel
                # so their unread badge updates even if they're not in this chat
                other_member_ids = await self.get_other_member_ids(self.conversation_id, self.user.id)
                for member_id in other_member_ids:
                    await self.channel_layer.group_send(
                        f"user_notifications_{member_id}",
                        {
                            "type": "new_chat_message_notify",
                            "conversation_id": int(self.conversation_id),
                            "sender_id": self.user.id,
                            "sender_username": self.user.username,
                            "preview": content[:60] if content else "Sent an attachment",
                        }
                    )

            elif action_type == "reaction":
                message_id = data.get("message_id")
                reaction_type = data.get("reaction_type", "").strip()

                if message_id and reaction_type:
                    reaction_data = await self.handle_reaction(message_id, self.user, reaction_type)
                    if reaction_data:
                        await self.channel_layer.group_send(
                            self.room_group_name, {"type": "chat_reaction", **reaction_data}
                        )

            elif action_type == "leave_group":
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "user_left",
                        "user_id": self.user.id,
                        "username": self.user.username,
                        "conversation_id": int(self.conversation_id),
                    }
                )
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
                await self.close()
                return

            elif action_type == "typing":
                is_typing = data.get("is_typing", False)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat_typing",
                        "user_id": self.user.id,
                        "username": self.user.username,
                        "avatar": await self.get_user_avatar(self.user),
                        "is_typing": is_typing,
                    },
                )

        except Exception:
            await self.send(text_data=json.dumps({"error": "Failed to parse message string format."}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def chat_reaction(self, event):
        await self.send(text_data=json.dumps(event))

    async def chat_typing(self, event):
        if event["user_id"] == self.user.id:
            return
        await self.send(text_data=json.dumps({
            "type": "typing",
            "user_id": event["user_id"],
            "username": event["username"],
            "avatar": event["avatar"],
            "is_typing": event["is_typing"],
        }))

    async def user_left(self, event):
        if event["user_id"] == self.user.id:
            return
        await self.send(text_data=json.dumps({
            "type": "user_left",
            "user_id": event["user_id"],
            "username": event["username"],
            "conversation_id": event["conversation_id"],
        }))

    async def member_added(self, event):
        await self.send(text_data=json.dumps({
            "type": "member_added",
            "user_id": event["user_id"],
            "username": event["username"],
            "actor_username": event["actor_username"],
            "conversation_id": event["conversation_id"],
        }))

    @database_sync_to_async
    def get_user_avatar(self, user):
        try:
            avatar = user.profile.profile_image
            return avatar.url if avatar else None
        except Exception as e:
            print(f"[Avatar] error: {e}")
            return None

    @database_sync_to_async
    def get_other_member_ids(self, conversation_id, current_user_id):
        ConversationMember = apps.get_model("api", "ConversationMember")
        return list(
            ConversationMember.objects
            .filter(conversation_id=conversation_id)
            .exclude(user_id=current_user_id)
            .values_list("user_id", flat=True)
        )

    @database_sync_to_async
    def check_membership(self, conversation_id, user):
        ConversationMember = apps.get_model("api", "ConversationMember")
        return ConversationMember.objects.filter(
            conversation_id=conversation_id, user=user, left_at__isnull=True
        ).exists()

    @database_sync_to_async
    def update_last_read(self, conversation_id, user):
        ConversationMember = apps.get_model("api", "ConversationMember")
        ConversationMember.objects.filter(conversation_id=conversation_id, user=user).update(last_read_at=now())

    @database_sync_to_async
    def save_message(self, conversation_id, sender, content, parent_id, post_id, base_url=""):
        from .serializers import PostSerializer

        Message = apps.get_model("api", "Message")

        msg = Message.objects.create(
            conversation_id=conversation_id,
            sender=sender,
            content=content,
            parent_message_id=parent_id,
            shared_post_id=post_id,
        )

        avatar_url = None
        try:
            avatar = sender.profile.profile_image
            if avatar:
                avatar_url = base_url + avatar.url if base_url else avatar.url
        except Exception:
            pass

        ConversationMember = apps.get_model("api", "ConversationMember")
        ConversationMember.objects.filter(conversation_id=conversation_id, user=sender).update(last_read_at=msg.sent_at)

        shared_post_data = None
        if post_id:
            try:
                from django.core.serializers.json import DjangoJSONEncoder
                Post = apps.get_model("api", "Post")
                post_obj = Post.objects.select_related(
                    "author__profile", "author__page"
                ).prefetch_related("media").get(post_id=post_id)

                class _FakeRequest:
                    def __init__(self, base):
                        self._base = base
                        self.user = sender

                    def build_absolute_uri(self, path):
                        if not path or path.startswith("http"):
                            return path
                        return self._base + path

                fake_req = _FakeRequest(base_url)
                raw = PostSerializer(post_obj, context={"request": fake_req}).data
                shared_post_data = json.loads(json.dumps(raw, cls=DjangoJSONEncoder))
            except Exception as e:
                print(f"[WS] Failed to serialize shared post {post_id}: {e}")

        return {
            "message_id": msg.message_id,
            "conversation_id": int(conversation_id),
            "sender_id": sender.id,
            "username": sender.username,
            "avatar": avatar_url,
            "content": msg.content,
            "parent_message_id": msg.parent_message_id,
            "shared_post_id": msg.shared_post_id,
            "shared_post": shared_post_data,
            "sent_at": msg.sent_at.isoformat(),
        }

    @database_sync_to_async
    def handle_reaction(self, message_id, user, reaction_type):
        MessageReaction = apps.get_model("api", "MessageReaction")

        existing = MessageReaction.objects.filter(
            message_id=message_id, user=user, message_reaction_type=reaction_type
        )

        if existing.exists():
            existing.delete()
            action = "removed"
        else:
            MessageReaction.objects.create(
                message_id=message_id, user=user, message_reaction_type=reaction_type
            )
            action = "added"

        try:
            avatar = user.profile.profile_image
            avatar_url = avatar.url if avatar else None
        except Exception:
            avatar_url = None

        return {
            "message_id": message_id,
            "user_id": user.id,
            "username": user.username,
            "avatar": avatar_url,
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
        try:
            data = json.loads(text_data)
            action = data.get("action")

            if action == "mark_all_read":
                pass
        except Exception:
            pass

    async def send_notification(self, event):
        """Handles general app notifications (likes, comments, follows, etc.)"""
        await self.send(
            text_data=json.dumps({
                "type": event.get("notification_type"),
                "id": event.get("id"),
                "notification_type": event.get("notification_type"),
                "message": event.get("description"),
                "title": event.get("title"),
                "description": event.get("description"),
                "created_at": event.get("created_at"),
                "extra_data": event.get("extra_data", {}),
                "actor_avatar": event.get("actor_avatar"),
                "actor_id": event.get("actor_id"),
                "is_read": event.get("is_read", False),
                "link": event.get("link", {}),
            })
        )

    async def new_chat_message_notify(self, event):
        """Handles real-time unread badge updates for chat rows"""
        await self.send(
            text_data=json.dumps({
                "type": "new_message",
                "conversation_id": event["conversation_id"],
                "sender_id": event["sender_id"],
                "sender_username": event["sender_username"],
                "preview": event["preview"],
            })
        )