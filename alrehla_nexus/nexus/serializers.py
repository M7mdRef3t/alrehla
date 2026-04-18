from rest_framework import serializers
from .models import UserInsight

class UserInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInsight
        fields = ['id', 'content', 'category', 'energy_level', 'exercise_code', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        # The user is already attached to the request by our middleware
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
