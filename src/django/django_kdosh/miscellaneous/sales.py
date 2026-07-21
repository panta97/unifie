from datetime import datetime, timedelta
from xmlrpc import client as xmlrpclib
from django.conf import settings

# pos.config id -> store. Daily sales are computed purely from pos.order, which
# matches the POS "Detalles de ventas" session reports exactly. Configs not
# listed here are intentionally excluded (VENTAS CORPORATIVAS, CAJA WEB,
# VENTAS POR MAYOR, CAJA 1 HUANUCO, DESCARTES).
POS_CONFIG_STORE = {
    "abtao": [4, 5, 6, 7, 8, 9, 14, 15, 18, 27, 28, 29, 30, 31, 32, 33, 34, 37, 41],
    "san_martin": [24, 26, 39, 40],
    "tingo_maria": [21, 22, 23, 25, 42],
}

# pos.order states that represent a completed sale (excludes draft/cancel).
POS_SALE_STATES = ["paid", "invoiced", "done"]

# Peru has no DST and is permanently UTC-5. pos.order.date_order is stored in
# UTC, so we shift the local day boundaries by this offset when filtering.
PERU_UTC_OFFSET_HOURS = 5


def sales(date):
    # GET ENVIRONMENT VARIABLES
    url = settings.ODOO_URL
    db = settings.ODOO_DB
    pwd = settings.ODOO_PWD
    uid = int(settings.ODOO_UID)

    models = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(url))

    # GET POS ORDERS FOR THE DAY
    # date_order is a UTC datetime, so convert the local (Peru) day to a UTC
    # range. This works for any date: open sessions expose sales as "paid"/
    # "invoiced" and closed sessions as "invoiced"/"done", all by date_order.
    day_start = datetime.strptime(date, "%Y-%m-%d") + timedelta(
        hours=PERU_UTC_OFFSET_HOURS
    )
    day_end = day_start + timedelta(days=1)
    pos_config_ids = [
        config_id
        for config_ids in POS_CONFIG_STORE.values()
        for config_id in config_ids
    ]
    pos_order_filter = [
        [
            ["date_order", ">=", day_start.strftime("%Y-%m-%d %H:%M:%S")],
            ["date_order", "<", day_end.strftime("%Y-%m-%d %H:%M:%S")],
            ["state", "in", POS_SALE_STATES],
            ["config_id", "in", pos_config_ids],
        ]
    ]
    pos_order_fields = ["amount_total", "config_id"]
    pos_orders = models.execute_kw(
        db,
        uid,
        pwd,
        "pos.order",
        "search_read",
        pos_order_filter,
        {"fields": pos_order_fields, "context": {"lang": "es_PE"}},
    )

    total_ab = 0
    total_sm = 0
    total_tg = 0

    for order in pos_orders:
        config_id = order["config_id"][0]
        if config_id in POS_CONFIG_STORE["abtao"]:
            total_ab += order["amount_total"]
        elif config_id in POS_CONFIG_STORE["san_martin"]:
            total_sm += order["amount_total"]
        elif config_id in POS_CONFIG_STORE["tingo_maria"]:
            total_tg += order["amount_total"]

    totals = [
        {
            "code": "ab-store",
            "name": "abtao",
            "amount": total_ab,
        },
        {
            "code": "sm-store",
            "name": "san martin",
            "amount": total_sm,
        },
        {
            "code": "tg-store",
            "name": "tingo maria",
            "amount": total_tg,
        },
    ]

    return totals
