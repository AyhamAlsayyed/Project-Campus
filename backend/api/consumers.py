import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.apps import apps


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
