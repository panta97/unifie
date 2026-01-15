from django.db import models


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

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


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
    end_state_amount = models.IntegerField()
    json = models.TextField()
    odoo_version = models.IntegerField(default=17)
