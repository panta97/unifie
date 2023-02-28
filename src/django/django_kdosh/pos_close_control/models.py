from django.db import models


class Employee(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)


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
    odoo_cash = models.DecimalField(max_digits=10, decimal_places=2)
    odoo_card = models.DecimalField(max_digits=10, decimal_places=2)
    pos_cash = models.DecimalField(max_digits=10, decimal_places=2)
    pos_card = models.DecimalField(max_digits=10, decimal_places=2)
    profit_total = models.DecimalField(max_digits=10, decimal_places=2)
    balance_start = models.DecimalField(max_digits=10, decimal_places=2)
    balance_start_next_day = models.DecimalField(max_digits=10, decimal_places=2)
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
    end_state_amount = models.DecimalField(max_digits=10, decimal_places=2)
    json = models.TextField()
