from django.db import models
from .reports.constants import (
    REPORT_DATATYPE_CHOICES,
    DATABASE_TARGET_CHOICES,
    DB_ODOO_V15,
)


class ProductCategory(models.Model):
    id = models.AutoField(primary_key=True)
    parent_id = models.IntegerField()
    name = models.CharField(max_length=200)
    display_name = models.CharField(max_length=200)

    class Meta:
        db_table = "rpc_product_category"


class PosCategory(models.Model):
    id = models.AutoField(primary_key=True)
    parent_id = models.IntegerField()
    name = models.CharField(max_length=200)
    display_name = models.CharField(max_length=200)

    class Meta:
        db_table = "rpc_pos_category"


class ProductAttribute(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)

    class Meta:
        db_table = "rpc_product_attribute"


class ProductAttributeValue(models.Model):
    id = models.AutoField(primary_key=True)
    attribute_id = models.IntegerField()
    name = models.CharField(max_length=200)
    attribute_name = models.CharField(max_length=200)

    class Meta:
        db_table = "rpc_product_attribute_value"


class ProductStats(models.Model):
    odoo_id = models.AutoField(primary_key=True)
    client_id = models.BigIntegerField()
    user_id = models.IntegerField()
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "rpc_product_stats"


class ResPartner(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    vat = models.CharField(max_length=200)

    class Meta:
        db_table = "rpc_res_partner"


class OrderStats(models.Model):
    odoo_id = models.AutoField(primary_key=True)
    user_id = models.IntegerField()
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "rpc_order_stats"


class ProductAttributeValueOrder(models.Model):
    attr_val_id = models.AutoField(primary_key=True)
    sort = models.IntegerField()

    class Meta:
        db_table = "rpc_product_attribute_value_order"


class WeightMap(models.Model):
    id = models.AutoField(primary_key=True)
    product_category_id = models.IntegerField(blank=True)
    weight = models.DecimalField(max_digits=9, decimal_places=4)

    class Meta:
        db_table = "rpc_weight_map"


# report


class Report(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=200)
    query = models.TextField(blank=False)
    db_target = models.CharField(
        choices=DATABASE_TARGET_CHOICES, max_length=20, default=DB_ODOO_V15
    )

    def __str__(self):
        return self.name


class ReportParam(models.Model):
    name = models.CharField(max_length=200)
    display_name = models.CharField(max_length=200, default="")
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    data_type = models.CharField(
        choices=REPORT_DATATYPE_CHOICES, max_length=20, blank=True
    )
