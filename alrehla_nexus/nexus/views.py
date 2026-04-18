from rest_framework import viewsets, permissions
from .models import UserInsight
from .serializers import UserInsightSerializer

class InsightViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows UserInsights to be viewed or edited.
    Strictly restricted to the owner of the data.
    """
    serializer_class = UserInsightSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return insights for the currently authenticated user only.
        This ensures strict data isolation.
        """
        user = self.request.user
        if user.is_anonymous:
            return UserInsight.objects.none()
        return UserInsight.objects.filter(user=user)

    def perform_create(self, serializer):
        """
        Attach the authenticated user to the new insight.
        """
        serializer.save(user=self.request.user)
