from xmlrpc import client as xmlrpclib
from django.conf import settings
import product_rpc.utils.rpc as rpc


def move_lines(invoice_number):
    proxy = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(settings.ODOO_URL))
    am_table = "account.move"
    am_filter = [[["name", "=", invoice_number]]]
    am_fields = ["id"]
    account_move = rpc.get_model(am_table, am_filter, am_fields)

    if len(account_move) != 1:
        raise ("Invoice not found")

    aml_table = "account.move.line"
    aml_filter = [
        [["move_id", "=", account_move[0]["id"]], ["product_id", "!=", False]]
    ]
    aml_fields = [
        "product_id",
        "name",
        "quantity",
        "price_unit",
        "price_total",
    ]
    account_move_lines = rpc.get_model(aml_table, aml_filter, aml_fields)
    for line in account_move_lines:
        line["product_id"] = line["product_id"][0]

    return account_move_lines
