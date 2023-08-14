from django.contrib import admin

from .models import Report, ReportParam


class ReportParamInline(admin.TabularInline):
    model = ReportParam
    extra = 1


class ReportAdmin(admin.ModelAdmin):
    inlines = [ReportParamInline]


admin.site.register(Report, ReportAdmin)
