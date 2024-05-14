import os
import re
from xmlrpc import client as xmlrpclib
from django.conf import settings


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

    for invoice in invoices:
        regex_search = re.search("^.+([B|F][A|0]\d{2})", invoice["journal_id"][1])
        serie = None
        if regex_search:
            serie = regex_search.group(1)
        else:
            print("bad invoice journal_id")
            print(invoice["id"])
            print(invoice["journal_id"])

        if serie in [
            "B001",
            "B003",
            "B004",
            "B005",
            "B006",
            "B007",
            "B008",
            "B013",
            "F001",
            "F003",
            "F004",
            "F005",
            "F006",
            "F007",
            "F008",
            "F013",
        ]:
            total_ab += invoice["amount_total"]
        elif serie in ["B002", "F002"]:
            total_sm += invoice["amount_total"]
        # elif serie == "BA01":
        #     total_ab -= invoice["amount_total"]
        # elif serie == "BA02":
        #     total_sm -= invoice["amount_total"]
        elif serie in [
            "B009",
            "B010",
            "B011",
            "B012",
            "F009",
            "F010",
            "F011",
            "F012",
        ]:
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
            "name": "tingo",
            "amount": total_tg,
        },
    ]

    return totals
