from rest_framework import serializers
from .models import Report, ReportParam


class ReportParamSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportParam
        fields = ("id", "name", "data_type")


class ReportSerializer(serializers.ModelSerializer):
    params = ReportParamSerializer(many=True, read_only=True, source="reportparam_set")

    class Meta:
        model = Report
        fields = ("id", "name", "params")
