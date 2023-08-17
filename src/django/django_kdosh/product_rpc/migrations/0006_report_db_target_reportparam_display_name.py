# Generated by Django 4.2.4 on 2023-08-17 01:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product_rpc', '0005_report_reportparam'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='db_target',
            field=models.CharField(choices=[('odoo_v11', 'odoo_v11'), ('odoo_v15', 'odoo_v15')], default='odoo_v15', max_length=20),
        ),
        migrations.AddField(
            model_name='reportparam',
            name='display_name',
            field=models.CharField(default='', max_length=200),
        ),
    ]