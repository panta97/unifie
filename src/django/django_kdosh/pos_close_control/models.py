import uuid
from django.db import models
from django.utils import timezone
from miscellaneous.constants import (
    POS_END_STATE_CHOICES,
    POS_STATUS_CHOICES,
    STABLE,
    DRAFT,
)


class Employee(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    CASHIER = "CA"
    MANAGER = "MN"
    TYPE_CHOICES = (
        (CASHIER, "CA"),
        (MANAGER, "MN"),
    )
    type = models.CharField(max_length=2, choices=TYPE_CHOICES, default=CASHIER)
    is_used = models.BooleanField(default=True)
    totp_secret = models.CharField(max_length=32, blank=True, default="")

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class OTPSession(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def is_expired(self):
        return (timezone.now() - self.last_activity).total_seconds() > 600

    def refresh(self):
        self.last_activity = timezone.now()
        self.save(update_fields=["last_activity"])

    def __str__(self):
        return f"OTPSession {self.token} for {self.employee}"


class PosSession(models.Model):
    id = models.AutoField(primary_key=True)
    pos_name = models.CharField(max_length=50)
    cashier = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="cashier"
    )
    manager = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="manager"
    )
    odoo_session_id = models.IntegerField()
    odoo_config_id = models.IntegerField(default=0)
    odoo_cash = models.DecimalField(max_digits=12, decimal_places=2)
    odoo_card = models.DecimalField(max_digits=12, decimal_places=2)
    pos_cash = models.DecimalField(max_digits=12, decimal_places=2)
    pos_card = models.DecimalField(max_digits=12, decimal_places=2)
    profit_total = models.DecimalField(max_digits=12, decimal_places=2)
    balance_start = models.DecimalField(max_digits=12, decimal_places=2)
    balance_start_next_day = models.DecimalField(max_digits=12, decimal_places=2)
    session_name = models.CharField(max_length=100)
    start_at = models.DateTimeField()
    stop_at = models.DateTimeField()

    EXTRA = "EX"
    STABLE = "ST"
    MISSING = "MS"
    END_STATE_CHOICES = (
        (EXTRA, "Extra"),
        (STABLE, "Stable"),
        (MISSING, "Missing"),
    )
    end_state = models.CharField(
        max_length=2,
        choices=END_STATE_CHOICES,
        default=STABLE,
    )
    end_state_note = models.TextField()
    end_state_amount = models.DecimalField(max_digits=12, decimal_places=2)
    json = models.TextField()
    odoo_version = models.IntegerField(default=17)


class PosSessionV2(models.Model):
    """
    Version 2 of POS Session model.
    All amount fields are stored as integers (cents) instead of decimals.
    For example, $123.45 is stored as 12345.
    """

    id = models.AutoField(primary_key=True)
    pos_name = models.CharField(max_length=50)
    cashier = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="cashier_v2",
        null=True,
        blank=True,
    )  # will be null when creating session in autosave
    manager = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="manager_v2",
        null=True,
        blank=True,
    )  # will be null when creating session in autosave
    odoo_session_id = models.IntegerField()
    odoo_config_id = models.IntegerField(default=0)
    # Amount fields stored as integers (cents)
    odoo_cash = models.IntegerField()
    odoo_card = models.IntegerField()
    pos_cash = models.IntegerField()
    pos_card = models.IntegerField()
    profit_total = models.IntegerField()
    balance_start = models.IntegerField()
    balance_start_next_day = models.IntegerField(default=0)
    session_name = models.CharField(max_length=100)
    start_at = models.DateTimeField()
    stop_at = models.DateTimeField(
        blank=True, null=True
    )  # will be null when creating session in autosave

    end_state = models.CharField(
        max_length=10,
        choices=POS_END_STATE_CHOICES,
        default=STABLE,
    )
    end_state_note = models.TextField()
    end_state_amount = models.IntegerField()
    json = models.TextField()
    odoo_version = models.IntegerField(default=17)

    # Status field for session lifecycle tracking
    status = models.CharField(
        max_length=10,
        choices=POS_STATUS_CHOICES,
        default=DRAFT,
    )


class PosSessionV2Snapshot(models.Model):
    """
    Historical snapshot of a POS session.
    Created when a CLOSED session is updated via PUT request.
    """

    id = models.AutoField(primary_key=True)
    # Metadata
    original_session_id = models.IntegerField()  # References odoo_session_id
    snapshot_created_at = models.DateTimeField(auto_now_add=True)

    # Copy of all PosSessionV2 fields at snapshot time
    pos_name = models.CharField(max_length=50)
    cashier = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="snapshot_cashier_v2",
    )
    manager = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="snapshot_manager_v2",
    )
    odoo_session_id = models.IntegerField()
    odoo_config_id = models.IntegerField()
    odoo_cash = models.IntegerField()
    odoo_card = models.IntegerField()
    pos_cash = models.IntegerField()
    pos_card = models.IntegerField()
    profit_total = models.IntegerField()
    balance_start = models.IntegerField()
    balance_start_next_day = models.IntegerField()
    session_name = models.CharField(max_length=100)
    start_at = models.DateTimeField()
    stop_at = models.DateTimeField(null=True, blank=True)
    end_state = models.CharField(
        max_length=10,
        choices=POS_END_STATE_CHOICES,
        default=STABLE,
    )
    end_state_note = models.TextField()
    end_state_amount = models.IntegerField()
    json = models.TextField()
    status = models.CharField(
        max_length=10,
        choices=POS_STATUS_CHOICES,
        default=DRAFT,
    )  # Status at snapshot time

    def __str__(self):
        return (
            f"Snapshot of Session {self.odoo_session_id} at {self.snapshot_created_at}"
        )
