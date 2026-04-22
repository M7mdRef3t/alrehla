from rest_framework import viewsets, permissions
from .models import UserInsight
from .serializers import UserInsightSerializer

class InsightViewSet(viewsets.ModelViewSet):
    serializer_class = UserInsightSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        عزل البيانات بشكل صارم: المستخدم لا يرى إلا بصائره الخاصة.
        """
        user_id = self.request.user.id
        return UserInsight.objects.filter(user_id=user_id).order_by('-created_at')

    def perform_create(self, serializer):
        """
        ربط البصيرة بالمستخدم اللي باعت الـ JWT آلياً.
        """
        serializer.save(user_id=self.request.user.id)
