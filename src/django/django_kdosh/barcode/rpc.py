from django.conf import settings


def get_model(proxy, obj_table, filter, fields):
    return proxy.execute_kw(
        settings.ODOO_DB,
        int(settings.ODOO_UID),
        settings.ODOO_PWD,
        obj_table,
        "search_read",
        filter,
        {"fields": fields, "context": {"lang": "es_PE"}},
    )
