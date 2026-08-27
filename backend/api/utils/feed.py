from datetime import timedelta

from django.db.models import (
    Case,
    Count,
    Exists,
    F,
    IntegerField,
    OuterRef,
    Q,
    Value,
    When,
)
from django.db.models.expressions import ExpressionWrapper
from django.db.models.functions import Now

from ..models import PostReaction, SavedPost


def base_annotations(user):
    return {
        "reactions_count": Count("reactions", filter=Q(reactions__user__isnull=False), distinct=True),
        "comments_count": Count("comments", distinct=True),
        "is_liked": Exists(PostReaction.objects.filter(post_id=OuterRef("post_id"), user=user)),
        "is_saved": Exists(SavedPost.objects.filter(post_id=OuterRef("post_id"), user=user)),
    }


def engagement_annotations():
    return {
        "p_engagement": ExpressionWrapper(
            (F("reactions_count") * Value(2)) + F("comments_count"),
            output_field=IntegerField(),
        ),
        "p_engagement_capped": Case(
            When(p_engagement__gte=20, then=Value(20)),
            default=F("p_engagement"),
            output_field=IntegerField(),
        ),
        "p_fresh": Case(
            When(created_at__gte=Now() - timedelta(hours=6), then=Value(20)),
            When(created_at__gte=Now() - timedelta(hours=24), then=Value(10)),
            When(created_at__gte=Now() - timedelta(days=3), then=Value(5)),
            default=Value(0),
            output_field=IntegerField(),
        ),
    }
