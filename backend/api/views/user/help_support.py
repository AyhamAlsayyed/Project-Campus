from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import BugReport, ContactTicket


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def submit_contact_ticket(request):
    subject = request.data.get("subject", "").strip()
    message = request.data.get("message", "").strip()
    screenshot = request.FILES.get("screenshot")

    if not subject or not message:
        return Response(
            {"error": "Both subject and message fields are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    ticket = ContactTicket.objects.create(user=request.user, subject=subject, message=message, screenshot=screenshot)

    return Response(
        {"message": "Ticket submitted successfully.", "ticket_id": ticket.ticket_id},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def submit_bug_report(request):
    message = request.data.get("message", "").strip()
    action_track = request.data.get("action_track", "").strip()
    screenshot = request.FILES.get("screenshot")

    if not message or not action_track:
        return Response(
            {"error": "Both message and action track logs are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    bug = BugReport.objects.create(user=request.user, message=message, action_track=action_track, screenshot=screenshot)

    return Response(
        {"message": "Bug report submitted successfully.", "bug_id": bug.bug_id},
        status=status.HTTP_201_CREATED,
    )
