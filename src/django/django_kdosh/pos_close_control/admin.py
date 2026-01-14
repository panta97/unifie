from django.contrib import admin
from .models import Employee, PosSession, PosSessionV2


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "type", "is_used")


@admin.register(PosSession)
class PosSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "pos_name",
        "cashier",
        "manager",
        "odoo_cash",
        "odoo_card",
        "pos_cash",
        "pos_card",
        "start_at",
        "stop_at",
        "odoo_version",
    )

    list_filter = ["odoo_version"]
    search_fields = ["id"]


@admin.register(PosSessionV2)
class PosSessionV2Admin(admin.ModelAdmin):
    list_display = (
        "id",
        "pos_name",
        "cashier",
        "manager",
        "odoo_cash",
        "odoo_card",
        "pos_cash",
        "pos_card",
        "start_at",
        "stop_at",
        "odoo_version",
    )

    list_filter = ["odoo_version"]
    search_fields = ["id"]
