import os
import re
from datetime import datetime, timedelta
from xmlrpc import client as xmlrpclib
from django.conf import settings
from product_rpc.utils.invoices import get_series_list

# pos.config id -> store, used to bucket paid POS orders that are not yet
# posted as account.move invoices (the POS session is still open).
# Configs not listed here are intentionally excluded from the totals
# (VENTAS CORPORATIVAS, CAJA WEB, VENTAS POR MAYOR, CAJA 1 HUANUCO, DESCARTES).
POS_CONFIG_STORE = {
    "abtao": [4, 5, 6, 7, 8, 9, 14, 15, 18, 27, 28, 29, 30, 31, 32, 33, 34, 37, 41],
    "san_martin": [24, 26, 39, 40],
    "tingo_maria": [21, 22, 23, 25, 42],
}

# Peru has no DST and is permanently UTC-5. pos.order.date_order is stored in
# UTC, so we shift the local day boundaries by this offset when filtering.
PERU_UTC_OFFSET_HOURS = 5


def sales(date):
    # GET ENVIRONMENT VARIABLES
    url = settings.ODOO_URL
    db = settings.ODOO_DB
    pwd = settings.ODOO_PWD
    uid = int(settings.ODOO_UID)

    # GET PURCHASE ORDER ID FROM GATEWAY API
    # date = event["date"]

    # GET ACCOUNT INVOICES
    invoice_filter = [
        [
            ["date", "=", date],
            ["state", "=", "posted"],
            ["move_type", "in", ["out_invoice", "out_refund"]],
        ]
    ]
    invoice_fields = ["journal_id", "amount_total"]
    models = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(url))
    invoices = models.execute_kw(
        db,
        uid,
        pwd,
        "account.move",
        "search_read",
        invoice_filter,
        {"fields": invoice_fields, "context": {"lang": "es_PE"}},
    )

    total_ab = 0
    total_sm = 0
    total_tg = 0

    year = date.split("-")[0]
    abtao_series = get_series_list("abtao", year)
    san_martin_series = get_series_list("san_martin", year)
    tingo_maria_series = get_series_list("tingo_maria", year)

    for invoice in invoices:
        regex_search = re.search("^.+([B|F][A|0]\d{2})", invoice["journal_id"][1])
        serie = None
        if regex_search:
            serie = regex_search.group(1)
        else:
            print("bad invoice journal_id")
            print(invoice["id"])
            print(invoice["journal_id"])

        if serie in abtao_series:
            total_ab += invoice["amount_total"]
        elif serie in san_martin_series:
            total_sm += invoice["amount_total"]
        # elif serie == "BA01":
        #     total_ab -= invoice["amount_total"]
        # elif serie == "BA02":
        #     total_sm -= invoice["amount_total"]
        elif serie in tingo_maria_series:
            total_tg += invoice["amount_total"]
    # elif company_id == 3:  ## olympo
    #     if serie in ["B001", "F001"]:
    #         total_ol += invoice["amount_total"]

    # GET PAID POS ORDERS NOT YET INVOICED
    # When a POS session is still open, its sales already live in pos.order but
    # the account.move invoice is only created once the session closes. Those
    # orders sit in state "paid" (an invoiced order moves off "paid", so this
    # filter also avoids double-counting anything already in account.move above).
    # date_order is a UTC datetime, so convert the local (Peru) day to a UTC range.
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
            ["state", "=", "paid"],
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
