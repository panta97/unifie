from django.db import models


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
    client_id = models.IntegerField()
    user_id = models.IntegerField()
    created = models.DateTimeField()

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
    created = models.DateTimeField()

    class Meta:
        db_table = "rpc_order_stats"


class ProductAttributeValueOrder(models.Model):
    attr_val_id = models.AutoField(primary_key=True)
    sort = models.IntegerField()

    class Meta:
        db_table = "rpc_product_attribute_value_order"
