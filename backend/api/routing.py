from django.urls import path

from .consumers import StatusConsumer

websocket_urlpatterns = [
    # Path for the front end: ws://localhost:8000/ws/status/
    path("ws/status/", StatusConsumer.as_asgi()),
]
