from django.contrib import admin
from .models import Employee


class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "type", "is_used")


admin.site.register(Employee, EmployeeAdmin)
