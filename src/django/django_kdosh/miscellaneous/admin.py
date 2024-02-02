from django.contrib import admin
from .models import StoreSection, StoreSectionGoal


@admin.register(StoreSection)
class StoreSectionAdmin(admin.ModelAdmin):
    list_display = ("supervisor", "section_name")


@admin.register(StoreSectionGoal)
class StoreSectionGoalAdmin(admin.ModelAdmin):
    list_display = ("year", "month", "goal", "section")
