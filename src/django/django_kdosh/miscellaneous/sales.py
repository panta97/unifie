import os
import re
from xmlrpc import client as xmlrpclib
from django.conf import settings
from product_rpc.utils.invoices import get_series_list


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
