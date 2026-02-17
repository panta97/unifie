import base64
from io import BytesIO
from django.contrib import admin
from django.utils.html import mark_safe
from .models import Employee, PosSession, PosSessionV2, PosSessionV2Snapshot, OTPSession


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "type", "is_used", "has_totp")
    readonly_fields = ("totp_qr_code",)

    def has_totp(self, obj):
        return bool(obj.totp_secret)

    has_totp.boolean = True
    has_totp.short_description = "TOTP"

    def totp_qr_code(self, obj):
        if not obj.totp_secret:
            return 'No TOTP secret configured. Paste a secret generated with: python -c "import pyotp; print(pyotp.random_base32())"'
        try:
            import pyotp
            import qrcode

            totp = pyotp.TOTP(obj.totp_secret)
            uri = totp.provisioning_uri(name=str(obj), issuer_name="Kdosh POS")
            img = qrcode.make(uri)
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            img_str = base64.b64encode(buffer.getvalue()).decode()
            return mark_safe(
                f'<img src="data:image/png;base64,{img_str}" width="200" height="200" />'
                f"<br><small>Scan with Google Authenticator or similar app</small>"
                f'<br><br><code style="word-break: break-all;">{uri}</code>'
            )
        except ImportError:
            return "Install pyotp and qrcode[pil] to display QR code"

    totp_qr_code.short_description = "TOTP QR Code"

    def get_fieldsets(self, request, obj=None):
        base_fieldsets = [
            (None, {"fields": ("first_name", "last_name", "type", "is_used")}),
        ]
        if obj and obj.type == Employee.MANAGER:
            base_fieldsets.append(
                (
                    "TOTP Authentication",
                    {
                        "fields": ("totp_secret", "totp_qr_code"),
                        "description": 'Generate a secret with: python -c "import pyotp; print(pyotp.random_base32())"',
                    },
                ),
            )
        return base_fieldsets


@admin.register(OTPSession)
class OTPSessionAdmin(admin.ModelAdmin):
    list_display = ("token", "employee", "created_at", "last_activity", "is_active")
    list_filter = ("is_active",)
    readonly_fields = ("token", "employee", "created_at", "last_activity")


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
        "status",
        "odoo_version",
    )

    list_filter = ["odoo_version", "status"]
    search_fields = ["id", "odoo_session_id"]


@admin.register(PosSessionV2Snapshot)
class PosSessionV2SnapshotAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "original_session_id",
        "snapshot_created_at",
        "pos_name",
        "cashier",
        "manager",
        "status",
    )

    list_filter = ["snapshot_created_at", "status"]
    search_fields = ["original_session_id", "odoo_session_id"]
    readonly_fields = ["snapshot_created_at"]
