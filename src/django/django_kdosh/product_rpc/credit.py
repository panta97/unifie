import json
import re
from datetime import datetime
from .utils import utils, rpc
from django.conf import settings


def get_credit_note(credit_note_number, company_ids=None, uid=2):
    if company_ids is None:
        company_ids = [1, 2, 3]
    proxy = rpc.get_proxy()
    credit_note_result = {"has_invoice": False}

    domain_credit_note = [
        ["move_type", "=", "out_refund"],
        ["company_id", "in", company_ids],
        ["name", "ilike", credit_note_number],
    ]
    json_model_credit_note = {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "account.move",
            "domain": domain_credit_note,
            "fields": ["id"],
            "limit": 1,
            "context": {"lang": "es_PE", "tz": "America/Lima", "uid": uid},
        },
        "id": 479230760,
    }
    result_list = rpc.execute_json_model(json_model_credit_note, uid, proxy=proxy)

    if not result_list:
        raise Exception("Credit Note not found")

    credit_note_id = result_list[0]["id"]
    credit_note_result["id"] = credit_note_id

    # SEGUNDA CONSULTA: Obtener detalles de la factura
    fields_to_read = [
        "name",
        "create_date",
        "invoice_date",
        "journal_id",
        "amount_untaxed",
        "amount_total",
        "user_id",
        "currency_id",
        "partner_id",
        "invoice_line_ids",
    ]
    json_model_details = {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [[credit_note_id], fields_to_read],
            "model": "account.move",
            "method": "read",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": uid,
                    "bin_size": True,
                }
            },
        },
        "id": 63473778,
    }
    result_list = rpc.execute_json_model(json_model_details, uid, proxy=proxy)
    credit_note_details = result_list[0]
    credit_note_details["create_date"] = utils.get_invoice_datetime_format(
        credit_note_details["create_date"]
    )
    credit_note_details["name"] = credit_note_details["name"].replace("\u200b", "")

    # CONSULTA DE PAGOS: Buscar pagos relacionados con la factura
    domain_payments = [["move_id", "=", credit_note_id], ["company_id", "in", company_ids]]
    json_model_payments = {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "account.payment",
            "domain": domain_payments,
            "fields": ["id", "amount", "journal_id"],
            "context": {"lang": "es_PE", "tz": "America/Lima", "uid": uid},
        },
        "id": 123456,
    }
    payment_result = rpc.execute_json_model(json_model_payments, uid, proxy=proxy)

    # PROCESAR PAGOS
    payments = []
    for payment in payment_result:
        payments.append(
            {
                "journal_name": payment.get("journal_id", ["", ""])[1],
                "amount": payment.get("amount"),
            }
        )

    credit_note_result["payments"] = payments

    # PROCESAR INFORMACIÓN DEL DIARIO
    journal_info = credit_note_details.get("journal_id")
    if journal_info and len(journal_info) > 1:
        if "Boleta" in journal_info[1]:
            credit_note_result["journal"] = "Nota de Crédito Boleta Electrónica"
        elif "Factura" in journal_info[1]:
            credit_note_result["journal"] = "Nota de Crédito Factura Electrónica"
        else:
            credit_note_result["journal"] = journal_info[1]

    # ESTRUCTURA FINAL DE RESPUESTA
    credit_note_result.update(
        {
            "name": credit_note_details["name"],
            "create_date": credit_note_details["create_date"],
            "invoice_date": credit_note_details["invoice_date"],
            "journal_id": credit_note_details["journal_id"],
            "amount_untaxed": credit_note_details["amount_untaxed"],
            "amount_total": credit_note_details["amount_total"],
            "user": credit_note_details.get("user_id", ["", ""])[1],
            "currency": credit_note_details.get("currency_id", ["", ""])[1],
        }
    )

    json_model = """{
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    51605
                ],
                [
                    "vat"
                ]
            ],
            "model": "res.partner",
            "method": "read",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "params": {
                        "action": 385
                    },
                    "bin_size": true
                }
            }
        },
        "id": 673667629
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["args"][0][0] = credit_note_details["partner_id"][0]
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    partner_details = result_list[0]

    credit_note_result["partner"] = {
        "id": credit_note_details["partner_id"][0],
        "name": credit_note_details["partner_id"][1],
        "doc_number": partner_details["vat"],
        "odoo_link": f"{settings.ODOO_URL}/web#id={credit_note_details['partner_id'][0]}&cids=1-2-3&menu_id=117&model=res.partner&view_type=form",
    }

    json_model = """{
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    555083,
                    555084,
                    555085
                ],
                [
                    "name",
                    "product_id",
                    "quantity",
                    "price_unit",
                    "price_subtotal",
                    "discount"
                ]
            ],
            "model": "account.move.line",
            "method": "read",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "default_type": "out_invoice",
                    "type": "out_invoice",
                    "is_company": true,
                    "is_customer": true,
                    "flat_all": true,
                    "params": {
                        "action": 388
                    },
                    "journal_id": 17,
                    "default_credit_note_id": 170683
                }
            }
        },
        "id": 133820991
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["args"][0] = credit_note_details["invoice_line_ids"]
    dict_model["params"]["kwargs"]["context"]["default_credit_note_id"] = credit_note_id
    credit_note_lines = rpc.execute_json_model(dict_model, uid, proxy=proxy)

    # GET REFUND INVOICES
    json_model = """{
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "account.move",
            "domain": [
                [
                    "move_type",
                    "=",
                    "out_refund"
                ],
                [
                    "reversed_entry_id",
                    "=",
                    "170683"
                ]
            ],
            "fields": ["name", "create_date", "id"],
            "limit": 80,
            "sort": "",
            "context": {
                "lang": "es_PE",
                "tz": "America/Lima",
                "uid": 1,
                "default_type": "out_invoice",
                "type": "out_invoice",
                "is_company": true,
                "is_customer": true,
                "flat_all": true,
                "params": {
                    "action": 388
                }
            }
        },
        "id": 208489698
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["domain"][1][2] = credit_note_id
    refund_invoices = rpc.execute_json_model(dict_model, uid, proxy=proxy)

    if len(refund_invoices) > 0:
        credit_note_result["has_refund"] = True
    for refund in refund_invoices:
        refund["create_date"] = utils.get_invoice_datetime_format(refund["create_date"])
        refund["odoo_link"] = (
            f"{settings.ODOO_URL}/web#id={refund['id']}&cids=1-2-3&menu_id=174&action=341&active_id=5&model=stock.picking&view_type=form"
        )
        if not refund["number"]:
            refund["number"] = "BORRADOR"
    credit_note_result["refund_invoices"] = refund_invoices

    # GET STOCK MOVES
    json_model = """{
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "stock.picking",
            "domain": [
                [
                    "origin",
                    "=",
                    "caja.abtao7/00000853"
                ]
            ],
            "fields": [
                "name"
            ],
            "limit": 1,
            "sort": "",
            "context": {
                "lang": "es_PE",
                "tz": "America/Lima",
                "uid": 1,
                "params": {
                    "action": 246,
                    "id": 231879,
                    "view_type": "form",
                    "model": "stock.picking",
                    "menu_id": 145,
                    "_push_me": false
                },
                "contact_display": "partner_address"
            }
        },
        "id": 34373841
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["domain"][0][2] = credit_note_details["name"]
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    invoice_stock_move = None
    for result in result_list:
        # exclude WH/IN/37331 or KD02/IN/03607 which are stock moves of loyalty points
        if not re.match(r"\w+\/\w+\/\d+", result["name"]):
            invoice_stock_move = result

    json_model = """{
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "stock.picking",
            "domain": [
                [
                    "origin",
                    "=",
                    "caja.abtao7/00000853"
                ]
            ],
            "fields": [
                "name",
                "create_date"
            ],
            "limit": 10,
            "sort": "",
            "context": {
                "lang": "es_PE",
                "tz": "America/Lima",
                "uid": 1,
                "params": {
                    "action": 246,
                    "id": 231879,
                    "view_type": "form",
                    "model": "stock.picking",
                    "menu_id": 145,
                    "_push_me": false
                },
                "contact_display": "partner_address"
            }
        },
        "id": 34373841
    }
    """
    stock_moves = []
    if invoice_stock_move:
        dict_model = json.loads(json_model)
        dict_model["params"]["domain"][0][
            2
        ] = f"Retorno de {invoice_stock_move['name']}"
        invoice_refund_stock_moves = rpc.execute_json_model(
            dict_model, uid, proxy=proxy
        )
        for stock_move in invoice_refund_stock_moves:
            stock_moves.append(
                {
                    "id": stock_move["id"],
                    "number": stock_move["name"],
                    "create_date": utils.get_invoice_datetime_format(
                        stock_move["create_date"]
                    ),
                    "odoo_link": f"{settings.ODOO_URL}/web#id={stock_move['id']}&cids=1-2-3&menu_id=174&action=341&active_id=5&model=stock.picking&view_type=form",
                }
            )
    credit_note_result["stock_moves"] = stock_moves

    credit_note_result["lines"] = []
    for line in credit_note_lines:
        match = re.search("(\\[.*\\]\\s)?(.*)", line["name"])
        if not match:
            raise Exception(f"could not find regex pattern for: {line['name']}")
        credit_note_result["lines"].append(
            {
                "id": line["id"],
                "product_id": line["product_id"][0],
                "name": match.group(2),
                "quantity": line["quantity"],
                "discount": line["discount"],
                "price_unit": line["price_unit"],
                "price_subtotal": line["price_subtotal"],
                "qty_refund": 0,
                "price_unit_refund": 0,
                "price_subtotal_refund": 0,
                "is_editing_refund": False,
            }
        )

    return credit_note_result
