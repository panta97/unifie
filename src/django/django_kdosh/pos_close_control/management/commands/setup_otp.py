import pyotp
from django.core.management.base import BaseCommand
from pos_close_control.models import Employee


class Command(BaseCommand):
    help = "Generate TOTP secrets for all active managers who don't have one yet, and print provisioning URLs."

    def handle(self, *args, **options):
        managers = Employee.objects.filter(type=Employee.MANAGER, is_used=True)

        if not managers.exists():
            self.stdout.write("No active managers found.")
            return

        for manager in managers:
            if manager.totp_secret:
                self.stdout.write(f"Skipped {manager} (already has TOTP secret)")
            else:
                manager.totp_secret = pyotp.random_base32()
                manager.save(update_fields=["totp_secret"])
                self.stdout.write(self.style.SUCCESS(f"Generated TOTP secret for {manager}"))

            totp = pyotp.TOTP(manager.totp_secret)
            uri = totp.provisioning_uri(name=str(manager), issuer_name="Kdosh POS")
            config_url = f"https://stellular-marzipan-2e9e1b.netlify.app/?config={uri}"

            self.stdout.write(f"  Username: {manager}")
            self.stdout.write(f"  OTP URL: {config_url}")
            self.stdout.write("")
