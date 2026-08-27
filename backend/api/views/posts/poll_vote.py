from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import PollOption, PollVote, Post

User = get_user_model()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def vote_poll(request, post_id):
    option_id = request.data.get("option_id")
    if not option_id:
        return Response({"error": "option_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        option = PollOption.objects.get(pk=option_id, post=post)
    except PollOption.DoesNotExist:
        return Response({"error": "Option not found for this post."}, status=status.HTTP_404_NOT_FOUND)

    user = request.user

    existing_vote = PollVote.objects.filter(user=user, option__post=post).select_related("option").first()

    if existing_vote:
        if existing_vote.option_id == option.id:
            existing_vote.delete()
            voted_option_id = None
        else:
            existing_vote.delete()
            PollVote.objects.create(user=user, option=option)
            voted_option_id = option.id
    else:
        PollVote.objects.create(user=user, option=option)
        voted_option_id = option.id

    options = PollOption.objects.filter(post=post).prefetch_related("votes__user__profile")
    total_votes = sum(opt.votes.count() for opt in options)

    poll_data = []
    for opt in options:
        count = opt.votes.count()
        voter_avatars = []
        for vote in list(opt.votes.all())[:4]:
            try:
                profile_pic = vote.user.profile.profile_image
                if profile_pic:
                    voter_avatars.append(request.build_absolute_uri(profile_pic.url))
            except Exception:
                pass
        poll_data.append({
            "id": opt.id,
            "text": opt.text,
            "votes_count": count,
            "percentage": round((count / total_votes * 100) if total_votes else 0, 1),
            "voter_avatars": voter_avatars,
        })

    return Response({
        "voted_option_id": voted_option_id,
        "total_votes": total_votes,
        "poll_options": poll_data,
    }, status=status.HTTP_200_OK)
