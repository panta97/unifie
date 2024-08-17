from django.contrib import admin
from .models import StoreSection, StoreSectionGoal, StoreGoal


@admin.register(StoreSection)
class StoreSectionAdmin(admin.ModelAdmin):
    list_display = ("supervisor", "section_name")


@admin.register(StoreSectionGoal)
class StoreSectionGoalAdmin(admin.ModelAdmin):
    list_display = ("year", "month", "goal", "section")


@admin.register(StoreGoal)
class StoreGoalAdmin(admin.ModelAdmin):
    list_display = ("year", "month", "goal", "store")
