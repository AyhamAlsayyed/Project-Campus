from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        import api.signals

        # Reset stale presence statuses once, on the first DB connection
        # after startup. Using connection_created avoids the "DB access in
        # ready()" warning while still running before any WebSocket connects.
        from django.db.backends.signals import connection_created
        connection_created.connect(self._reset_online_statuses_once)

    def _reset_online_statuses_once(self, sender, connection, **kwargs):
        """
        Fires exactly once — on the first DB connection after server startup.
        Resets all non-offline statuses to 'offline' to clear stale presence
        data from previous sessions (server crash, unclean disconnect, etc.).
        """
        from django.db.backends.signals import connection_created
        # Disconnect immediately so this only runs once per process lifetime
        connection_created.disconnect(self._reset_online_statuses_once)

        try:
            UserProfile = self.get_model("UserProfile")
            updated = UserProfile.objects.filter(
                status__in=["online", "away", "dnd"]
            ).update(status="offline")
            if updated:
                print(f"[Presence] Cleared {updated} stale online status(es) on startup.")
        except Exception:
            pass
