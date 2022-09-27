import re
import json
from .utils import utils, rpc
from django.conf import settings
from datetime import datetime



def get_invoice(invoice_number):
    uid = 1
    proxy = rpc.get_proxy()
    invoice_result = {
        "has_refund": False
    }

    json_model = """{
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "account.invoice",
            "domain": [
                [
                    "type",
                    "=",
                    "out_invoice"
                ],
                [
                    "company_id",
                    "=",
                    1
                ],
                [
                    "number",
                    "=",
                    "B001-00073204"
                ]
            ],
            "fields": ["id"],
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
        "id": 479230760
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["domain"][2][2] = invoice_number
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    if len(result_list) < 1: raise Exception("invoice not found")
    invoice_id = result_list[0]["id"]

    invoice_result["id"] = invoice_id

    json_model = """{
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    170683
                ],
                [
                    "number",
                    "create_date",
                    "date_invoice",
                    "journal_sunat_type",
                    "amount_untaxed",
                    "amount_total",
                    "user_id",
                    "currency_id",
                    "journal_id",
                    "payments_widget",
                    "partner_id",
                    "invoice_line_ids",
                    "origin"
                ]
            ],
            "model": "account.invoice",
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
                    "bin_size": true
                }
            }
        },
        "id": 63473778
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["args"][0][0] = invoice_id
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    invoice_details = result_list[0]
    invoice_details["create_date"] = utils.get_invoice_datetime_format(invoice_details["create_date"])

    payments = json.loads(invoice_details["payments_widget"])["content"]
    payments.sort(key=lambda x: x.get("move_id"))

    invoice_result["journal"] = ""
    if "Boleta" in invoice_details["journal_id"][1]:
        invoice_result["journal"] = "Boleta de Venta Electrónica"
    elif "Factura" in invoice_details["journal_id"][1]:
        invoice_result["journal"] = "Factura Electrónica"
    else: raise Exception("bad journal id")

    invoice_result["number"] = invoice_details["number"]
    invoice_result["create_date"] = invoice_details["create_date"]
    invoice_result["date_invoice"] = invoice_details["date_invoice"]
    invoice_result["journal_sunat_type"] = invoice_details["journal_sunat_type"]
    invoice_result["amount_untaxed"] = invoice_details["amount_untaxed"]
    invoice_result["amount_total"] = invoice_details["amount_total"]
    invoice_result["user"] = invoice_details["user_id"][1]
    invoice_result["currency"] = invoice_details["currency_id"][1]
    invoice_result["payments"] = []

    for payment in payments:
        invoice_result["payments"].append({
            "journal_name": payment["journal_name"],
            "amount": payment["amount"]
        })

    json_model = """{
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    51605
                ],
                [
                    "doc_number"
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
    dict_model["params"]["args"][0][0] = invoice_details["partner_id"][0]
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    partner_details = result_list[0]

    invoice_result["partner"] = {
        "id": invoice_details["partner_id"][0],
        "name": invoice_details["partner_id"][1],
        "doc_number": partner_details["doc_number"],
        "odoo_link": f"{settings.ODOO_URL}/web#id={invoice_details['partner_id'][0]}&view_type=form&model=res.partner&menu_id=262&action=385"
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
            "model": "account.invoice.line",
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
                    "default_invoice_id": 170683
                }
            }
        },
        "id": 133820991
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["args"][0] = invoice_details["invoice_line_ids"]
    dict_model["params"]["kwargs"]["context"]["default_invoice_id"] = invoice_id
    invoice_lines = rpc.execute_json_model(dict_model, uid, proxy=proxy)

    # GET REFUND INVOICES
    json_model = """{
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "account.invoice",
            "domain": [
                [
                    "type",
                    "=",
                    "out_refund"
                ],
                [
                    "origin",
                    "=",
                    "B003-00183770"
                ]
            ],
            "fields": [
                "number",
                "create_date"
            ],
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
    dict_model["params"]["domain"][1][2] = invoice_number
    refund_invoices = rpc.execute_json_model(dict_model, uid, proxy=proxy)

    if len(refund_invoices) > 0: invoice_result["has_refund"] = True
    for refund in refund_invoices:
        refund["create_date"] = utils.get_invoice_datetime_format(refund["create_date"])
        refund["odoo_link"] = f"{settings.ODOO_URL}/web#id={refund['id']}&view_type=form&model=account.invoice&menu_id=83&action=388"
        if not refund["number"]: refund["number"] = "BORRADOR"
    invoice_result["refund_invoices"] = refund_invoices

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
    dict_model["params"]["domain"][0][2] = invoice_details["origin"]
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
        dict_model["params"]["domain"][0][2] = f"Retorno de {invoice_stock_move['name']}"
        invoice_refund_stock_moves = rpc.execute_json_model(dict_model, uid, proxy=proxy)
        for stock_move in invoice_refund_stock_moves:
            stock_moves.append({
                "id": stock_move["id"],
                "number": stock_move["name"],
                "create_date": utils.get_invoice_datetime_format(stock_move["create_date"]),
                "odoo_link": f"{settings.ODOO_URL}/web#id={stock_move['id']}&view_type=form&model=stock.picking&action=246&menu_id=145"
            })
    invoice_result["stock_moves"] = stock_moves


    invoice_result["lines"] = []
    for line in invoice_lines:
        match = re.search("(\[.*\]\s)?(.*)", line["name"])
        if not match: raise Exception(f"could not find regex pattern for: {line['name']}")
        invoice_result["lines"].append({
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

        })

    return invoice_result


def invoice_refund(invoice_details, stock_location):
    uid = 1
    _result = {
        "refund_invoice": {},
        "stock_move": {},
    }
    proxy = rpc.get_proxy()
    _invoice_id =  invoice_details["id"]
    _invoice_lines = invoice_details["lines"]
    _parent_location_id = stock_location["parent_location_id"]
    _original_location_id = stock_location["original_location_id"]
    today = datetime.now().strftime("%Y-%m-%d")

    #region --------- CREATE REFUND INVOICE --------- #

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
            [170466],
            {
                "pse_state": "accepted"
            }
            ],
            "model": "account.invoice",
            "method": "write",
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
                }
            }
            }
        },
        "id": 31988752
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0][0] = _invoice_id
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("01. update Estado de PSE to Aceptado")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                {
                    "filter_refund": "refund",
                    "response_code": "01",
                    "description": "Anulación de la operación",
                    "date_invoice": "2021-12-18",
                    "date": false
                }
            ],
            "model": "account.invoice.refund",
            "method": "create",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "params": {
                        "action": 388,
                        "view_type": "list",
                        "model": "account.invoice",
                        "menu_id": 83,
                        "_push_me": false
                    },
                    "type": "out_invoice",
                    "is_company": true,
                    "is_customer": true,
                    "flat_all": true,
                    "active_model": "account.invoice",
                    "active_id": 170365,
                    "active_ids": [
                        170365
                    ],
                    "search_disable_custom_filters": true
                }
            }
        },
        "id": 197622839
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0]["date_invoice"] = today
    dict_model["params"]["kwargs"]["context"]["active_id"] = _invoice_id
    dict_model["params"]["kwargs"]["context"]["active_ids"][0] = _invoice_id
    pre_refund_id = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("02. create refund invoice draf")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "account.invoice.refund",
            "method": "invoice_refund",
            "domain_id": null,
            "context_id": 1,
            "args": [
                [
                    5063
                ],
                {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "params": {
                        "action": 388,
                        "view_type": "list",
                        "model": "account.invoice",
                        "menu_id": 83,
                        "_push_me": false
                    },
                    "type": "out_invoice",
                    "is_company": true,
                    "is_customer": true,
                    "flat_all": true,
                    "active_model": "account.invoice",
                    "active_id": 170365,
                    "active_ids": [
                        170365
                    ],
                    "search_disable_custom_filters": true
                }
            ]
        },
        "id": 327309453
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["args"][1]["uid"] = uid
    dict_model["params"]["args"][1]["active_id"] = _invoice_id
    dict_model["params"]["args"][1]["active_ids"][0] = _invoice_id
    dict_model["params"]["args"][0][0] = pre_refund_id
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    refund_id = result_list['domain'][0][2][0]
    print("03. create refund invoice")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    191792
                ],
                [
                    "invoice_line_ids",
                    "tax_line_ids",
                    "number",
                    "create_date"
                ]
            ],
            "model": "account.invoice",
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
                    "bin_size": true
                }
            }
        },
        "id": 376032110
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0][0] = refund_id
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    refund_invoice_details = result_list[0]
    print("03.1 get refund invoice details")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    620401,
                    620402,
                    620403,
                    620405
                ],
                [
                    "product_id"
                ]
            ],
            "model": "account.invoice.line",
            "method": "read",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "default_type": "out_invoice",
                    "type": "out_refund",
                    "is_company": true,
                    "is_customer": true,
                    "flat_all": true,
                    "params": {
                        "action": 388
                    },
                    "journal_id": 15,
                    "default_invoice_id": 191792
                }
            }
        },
        "id": 560055223
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0] = refund_invoice_details["invoice_line_ids"]
    dict_model["params"]["kwargs"]["context"]["default_invoice_id"] = refund_id
    refund_invoice_lines = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("03.2 get refund invoice lines")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    191791
                ],
                {
                    "invoice_line_ids": [
                        [
                            4,
                            620396,
                            false
                        ],
                        [
                            4,
                            620397,
                            false
                        ],
                        [
                            2,
                            620398,
                            false
                        ],
                        [
                            2,
                            620399,
                            false
                        ],
                        [
                            1,
                            620400,
                            {
                                "quantity": 1
                            }
                        ]
                    ],
                    "tax_line_ids": [
                        [
                            0,
                            "virtual_1089",
                            {
                                "name": "IGV 18% Venta",
                                "tax_id": 2,
                                "account_id": 576,
                                "account_analytic_id": false,
                                "amount": 0,
                                "amount_rounding": 0,
                                "manual": false,
                                "sequence": 1,
                                "currency_id": 164
                            }
                        ],
                        [
                            2,
                            194899,
                            false
                        ]
                    ]
                }
            ],
            "model": "account.invoice",
            "method": "write",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "type": "out_refund",
                    "is_company": true,
                    "is_customer": "True",
                    "flat_all": true,
                    "params": {
                        "action": 388
                    },
                    "active_model": "account.invoice.refund",
                    "search_disable_custom_filters": true,
                    "active_id": 5315,
                    "active_ids": [
                        5315
                    ],
                    "default_type": "out_refund",
                    "sunat_payment_type": [
                        "07"
                    ],
                    "is_note": "True",
                    "search_default_only_customer_credit_note": 1
                }
            }
        },
        "id": 325808041
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0][0] = refund_id
    dict_model["params"]["args"][1]["tax_line_ids"][1][1] = refund_invoice_details["tax_line_ids"][0]

    for line, r_line in zip(_invoice_lines, refund_invoice_lines):
        if line["product_id"] != r_line["product_id"][0]:
            raise Exception(f"lines do not match for product id: {line['product_id']}")

    refund_lines_update = []
    for line, r_line in zip(_invoice_lines, refund_invoice_lines):
        line_update = []
        # leave as is
        if line["qty_refund"] == line["quantity"] and line["price_subtotal"] == line["price_subtotal_refund"]:
            line_update = [4, r_line["id"], False]
        # update custom
        elif line["qty_refund"] > 0:
            price_unit = line["price_subtotal_refund"] / line["qty_refund"]
            if line["discount"] > 0:
                # we increase the price unit because a discount will be applied
                price_unit *= (100 / (100 - line["discount"]))
            line_update = [1, r_line["id"], {
                "quantity": line["qty_refund"],
                "price_unit": price_unit,
            }]
        # delete all
        elif line["qty_refund"] == 0:
            line_update = [2, r_line["id"], False]
        refund_lines_update.append(line_update)
    dict_model["params"]["args"][1]["invoice_line_ids"] = refund_lines_update
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    if not result_list: raise Exception("could not update refund invoice lines")
    print("03.3 update refund invoice lines")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "account.invoice",
            "method": "action_invoice_open",
            "domain_id": null,
            "context_id": 1,
            "args": [
                [
                    170615
                ],
                {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "params": {
                        "action": 388,
                        "view_type": "list",
                        "model": "account.invoice",
                        "menu_id": 83,
                        "_push_me": false
                    },
                    "default_type": "out_invoice",
                    "type": "out_invoice",
                    "is_company": true,
                    "is_customer": true,
                    "flat_all": true
                }
            ]
        },
        "id": 855477827
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["args"][1]["uid"] = uid
    dict_model["params"]["args"][0][0] = refund_id
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("04. validate invoice refund")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    191792
                ],
                [
                    "number",
                    "create_date"
                ]
            ],
            "model": "account.invoice",
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
                    "bin_size": true
                }
            }
        },
        "id": 376032110
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0][0] = refund_id
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    refund_invoice_details = result_list[0]
    print(f"04.1 get refund invoice create_date and number")
    _result["refund_invoice"]["id"] = refund_id
    _result["refund_invoice"]["number"] = refund_invoice_details["number"]
    _result["refund_invoice"]["create_date"] = utils.get_invoice_datetime_format(refund_invoice_details["create_date"])
    _result["refund_invoice"]["odoo_link"] = f"{settings.ODOO_URL}/web#id={refund_id}&view_type=form&model=account.invoice&menu_id=83&action=388"

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
            [170617],
            ["partner_id", "amount_total", "currency_id", "date_invoice", "reference"]
            ],
            "model": "account.invoice",
            "method": "read",
            "kwargs": {
            "context": {
                "lang": "es_PE",
                "tz": "America/Lima",
                "uid": 1,
                "params": {
                "action": 388,
                "id": 170617,
                "view_type": "form",
                "model": "account.invoice",
                "menu_id": 83,
                "_push_me": false
                },
                "default_type": "out_invoice",
                "type": "out_invoice",
                "is_company": true,
                "is_customer": true,
                "flat_all": true,
                "bin_size": true
            }
            }
        },
        "id": 81282507
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0][0] = refund_id
    dict_model["params"]["kwargs"]["context"]["params"]["id"] = refund_id
    refund_fields = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("05. invoice refund fields")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                {
                    "payment_type": "outbound",
                    "partner_type": "customer",
                    "partner_id": 44991,
                    "amount": 50,
                    "currency_id": 164,
                    "payment_detraction": false,
                    "payment_detraction_completed": false,
                    "date_payment_detraction": "2021-12-19",
                    "constance_payment_detraction": false,
                    "payment_date": "2021-12-19",
                    "communication": "caja.sanmartin1/00015735",
                    "payment_difference_handling": "open",
                    "writeoff_label": "Write-Off",
                    "journal_id": 9,
                    "payment_method_id": 2,
                    "payment_token_id": false,
                    "writeoff_account_id": false
                }
            ],
            "model": "account.payment",
            "method": "create",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "params": {
                        "action": 388,
                        "id": 170617,
                        "view_type": "form",
                        "model": "account.invoice",
                        "menu_id": 83,
                        "_push_me": false
                    },
                    "type": "out_invoice",
                    "is_company": true,
                    "is_customer": true,
                    "flat_all": true,
                    "active_model": "account.invoice",
                    "active_id": 170619,
                    "active_ids": [
                        170619
                    ],
                    "default_invoice_ids": [
                        [
                            4,
                            170619
                        ]
                    ],
                    "search_disable_custom_filters": true
                }
            }
        },
        "id": 875750074
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0]["partner_id"] = refund_fields[0]["partner_id"][0]
    dict_model["params"]["args"][0]["amount"] = refund_fields[0]["amount_total"]
    dict_model["params"]["args"][0]["currency_id"] = refund_fields[0]["currency_id"][0]
    dict_model["params"]["args"][0]["date_payment_detraction"] = refund_fields[0]["date_invoice"]
    dict_model["params"]["args"][0]["payment_date"] = refund_fields[0]["date_invoice"]
    dict_model["params"]["args"][0]["communication"] = refund_fields[0]["reference"]

    dict_model["params"]["kwargs"]["context"]["active_id"] = refund_id
    dict_model["params"]["kwargs"]["context"]["active_ids"][0] = refund_id
    dict_model["params"]["kwargs"]["context"]["default_invoice_ids"][0][1] = refund_id

    account_payment_id = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print(f"06. pre-validate invoice payment")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "account.payment",
            "method": "action_validate_invoice_payment",
            "domain_id": null,
            "context_id": 1,
            "args": [
                [
                    181103
                ],
                {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "params": {
                        "action": 388,
                        "id": 170617,
                        "view_type": "form",
                        "model": "account.invoice",
                        "menu_id": 83,
                        "_push_me": false
                    },
                    "type": "out_invoice",
                    "is_company": true,
                    "is_customer": true,
                    "flat_all": true,
                    "active_model": "account.invoice",
                    "active_id": 170621,
                    "active_ids": [
                        170621
                    ],
                    "default_invoice_ids": [
                        [
                            4,
                            170621
                        ]
                    ],
                    "search_disable_custom_filters": true
                }
            ]
        },
        "id": 197235430
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["args"][1]["uid"] = uid
    dict_model["params"]["args"][0][0] = account_payment_id
    dict_model["params"]["args"][1]["active_id"] = refund_id
    dict_model["params"]["args"][1]["active_ids"][0] = refund_id
    dict_model["params"]["args"][1]["default_invoice_ids"][0][1] = refund_id

    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("07. validate invoice payment")

    #endregion

    #region --------- UPDATE STOCK INVENTORY --------- #

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "stock.picking",
            "domain": [
                [
                    "origin",
                    "=",
                    "caja.abtao3/00007681"
                ],
                [
                    "location_dest_id",
                    "=",
                    9
                ]
            ],
            "fields": [
                "id"
            ],
            "limit": 80,
            "sort": "",
            "context": {
                "lang": "es_PE",
                "tz": "America/Lima",
                "uid": 1,
                "contact_display": "partner_address",
                "params": {
                    "action": 246
                }
            }
        },
        "id": 309209178
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["context"]["uid"] = uid
    dict_model["params"]["domain"][0][2] = refund_fields[0]["reference"]
    stock_move = rpc.execute_json_model(dict_model, uid, proxy=proxy)

    if len(stock_move) > 1:
        raise Exception("found more than one stock move")

    print("08. found stock move")


    json_model = """ {
         "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    193814
                ],
                [
                    "id",
                    "move_line_ids",
                    "location_id",
                    "location_dest_id"
                ]
            ],
            "model": "stock.picking",
            "method": "read",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "contact_display": "partner_address",
                    "params": {
                        "action": 246
                    },
                    "bin_size": true
                }
            }
        },
        "id": 403748289
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0][0] = stock_move[0]["id"]
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    stock_move_result = result_list[0]
    print("09. found stock move result")


    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    572775,
                    572776,
                    572777,
                    572778,
                    572779
                ],
                [
                    "product_id",
                    "move_id",
                    "qty_done"
                ]
            ],
            "model": "stock.move.line",
            "method": "read",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "contact_display": "partner_address",
                    "params": {
                        "action": 246
                    },
                    "default_picking_id": 193814,
                    "default_location_id": 30,
                    "default_location_dest_id": 9
                }
            }
        },
        "id": 219341866
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0] = stock_move_result["move_line_ids"]
    dict_model["params"]["kwargs"]["context"]["default_picking_id"] = stock_move_result["id"]
    dict_model["params"]["kwargs"]["context"]["default_location_id"] = stock_move_result["location_id"][0]
    dict_model["params"]["kwargs"]["context"]["default_location_dest_id"] = stock_move_result["location_dest_id"][0]
    move_line_ids = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("10. found stock move line ids")

    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "args": [
    #             [
    #                 "move_dest_exists",
    #                 "product_return_moves",
    #                 "parent_location_id",
    #                 "original_location_id",
    #                 "location_id"
    #             ]
    #         ],
    #         "model": "stock.return.picking",
    #         "method": "default_get",
    #         "kwargs": {
    #             "context": {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "contact_display": "partner_address",
    #                 "params": {
    #                     "action": 246
    #                 },
    #                 "active_model": "stock.picking",
    #                 "active_id": 190454,
    #                 "active_ids": [
    #                     190454
    #                 ],
    #                 "search_disable_custom_filters": true
    #             }
    #         }
    #     },
    #     "id": 63956484
    # }
    # """
    # dict_model = json.loads(json_model)
    # dict_model["params"]["kwargs"]["context"]["uid"] = uid
    # dict_model["params"]["kwargs"]["context"]["active_id"] = stock_move_result["id"]
    # dict_model["params"]["kwargs"]["context"]["active_ids"][0] = stock_move_result["id"]
    # stock_return_picking_locations = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # print(f"10.1 found stock return picking locations:\n{stock_return_picking_locations}")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                {
                    "product_return_moves": [
                        [
                            0,
                            "virtual_22393",
                            {
                                "product_id": 119101,
                                "quantity": 1,
                                "to_refund": false,
                                "move_id": 574964
                            }
                        ],
                        [
                            0,
                            "virtual_22401",
                            {
                                "product_id": 121107,
                                "quantity": 7,
                                "to_refund": false,
                                "move_id": 574966
                            }
                        ],
                        [
                            0,
                            "virtual_22405",
                            {
                                "product_id": 117092,
                                "quantity": 1,
                                "to_refund": false,
                                "move_id": 574967
                            }
                        ],
                        [
                            0,
                            "virtual_22409",
                            {
                                "product_id": 117740,
                                "quantity": 1,
                                "to_refund": false,
                                "move_id": 574968
                            }
                        ]
                    ],
                    "parent_location_id": 11,
                    "original_location_id": 30,
                    "location_id": 30
                }
            ],
            "model": "stock.return.picking",
            "method": "create",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "contact_display": "partner_address",
                    "params": {
                        "action": 246
                    },
                    "active_model": "stock.picking",
                    "active_id": 193814,
                    "active_ids": [
                        193814
                    ],
                    "search_disable_custom_filters": true
                }
            }
        },
        "id": 435986473
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    product_return_moves = []

    # we sort out lines with no refund when we have lines with same product id
    invoice_lines_to_refund = [line for line in _invoice_lines if line['qty_refund'] > 0]
    # sort both list by product id so they math when looping
    invoice_lines_to_refund.sort(key=lambda x: x["product_id"])
    invoice_lines_to_refund_product_ids = [line["product_id"] for line in invoice_lines_to_refund]
    move_line_ids = list(filter(lambda x: x["product_id"][0] in invoice_lines_to_refund_product_ids, move_line_ids))
    move_line_ids.sort(key=lambda x: x["product_id"][0])

    virtual = 22400 # just because TODO: use random
    for move_line, refund_line in zip(move_line_ids, invoice_lines_to_refund):
        if move_line["qty_done"] % 1 > 0:
            raise Exception("qty is not an integer number")
        return_move = {
            "product_id": move_line["product_id"][0],
            "quantity": refund_line["qty_refund"],
            "to_refund": False,
            "move_id": move_line["move_id"][0]
        }
        virtual += 10
        product_return_moves.append([
            0,
            f"virtual_{virtual}",
            return_move
        ])

    dict_model["params"]["args"][0]["product_return_moves"] = product_return_moves
    dict_model["params"]["args"][0]["parent_location_id"] = _parent_location_id
    dict_model["params"]["args"][0]["original_location_id"] = _original_location_id
    dict_model["params"]["args"][0]["location_id"] = _original_location_id
    dict_model["params"]["kwargs"]["context"]["active_id"] = stock_move[0]["id"]
    dict_model["params"]["kwargs"]["context"]["active_ids"][0] = stock_move[0]["id"]
    stock_return_picking_id = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("11. stock return picking done")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "stock.return.picking",
            "method": "create_returns",
            "domain_id": null,
            "context_id": 1,
            "args": [
                [
                    4843
                ],
                {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "contact_display": "partner_address",
                    "params": {
                        "action": 246
                    },
                    "active_model": "stock.picking",
                    "active_id": 193814,
                    "active_ids": [
                        193814
                    ],
                    "search_disable_custom_filters": true
                }
            ]
        },
        "id": 571191483
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["args"][1]["uid"] = uid
    dict_model["params"]["args"][0][0] = stock_return_picking_id
    dict_model["params"]["args"][1]["active_id"] = stock_move[0]["id"]
    dict_model["params"]["args"][1]["active_ids"][0] = stock_move[0]["id"]
    stock_picking_result = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("12. stock return picking call_button done")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    195222
                ],
                [
                    "id",
                    "location_id",
                    "location_dest_id",
                    "move_line_ids",
                    "move_lines",
                    "create_date",
                    "name"
                ]
            ],
            "model": "stock.picking",
            "method": "read",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "contact_display": "partner_address",
                    "params": {
                        "action": 246
                    },
                    "bin_size": true
                }
            }
        },
        "id": 536512313
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0][0] = stock_picking_result["res_id"]
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    stock_pickig_details = result_list[0]
    print("13. read stock picking details")
    _result["stock_move"]["id"] = stock_pickig_details["id"]
    _result["stock_move"]["number"] = stock_pickig_details["name"]
    _result["stock_move"]["create_date"] = utils.get_invoice_datetime_format(stock_pickig_details["create_date"])
    _result["stock_move"]["odoo_link"] = f"{settings.ODOO_URL}/web#id={stock_pickig_details['id']}&view_type=form&model=stock.picking&action=246&menu_id=145"

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    575966,
                    575967,
                    575968,
                    575969
                ],
                [
                    "product_id",
                    "product_uom_qty"
                ]
            ],
            "model": "stock.move.line",
            "method": "read",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "contact_display": "partner_address",
                    "params": {
                        "action": 246
                    },
                    "default_picking_id": 195222,
                    "default_location_id": 9,
                    "default_location_dest_id": 30
                }
            }
        },
        "id": 715312400
    }
    """

    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0] = stock_pickig_details["move_line_ids"]
    dict_model["params"]["kwargs"]["context"]["default_picking_id"] = stock_pickig_details["id"]
    dict_model["params"]["kwargs"]["context"]["default_location_id"] = stock_pickig_details["location_id"]
    dict_model["params"]["kwargs"]["context"]["default_location_dest_id"] = stock_pickig_details["location_dest_id"]
    stock_pickig_lines = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("14. read stock picking lines")

    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    578157
                ],
                {
                    "move_line_ids": [
                        [
                            1,
                            575959,
                            {
                                "qty_done": 1
                            }
                        ]
                    ]
                }
            ],
            "model": "stock.move",
            "method": "write",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "contact_display": "partner_address",
                    "params": {
                        "action": 246
                    },
                    "active_model": "stock.move",
                    "active_id": 578157,
                    "active_ids": [
                        578157
                    ],
                    "show_lots_m2o": false,
                    "show_lots_text": false,
                    "show_source_location": "stock.location()",
                    "show_destination_location": "stock.location()",
                    "show_package": true,
                    "show_reserved_quantity": true,
                    "search_disable_custom_filters": true
                }
            }
        },
        "id": 451695919
    }
    """
    # fields "product_product_id", "move_line", "move_line_id", "qty_done"
    stock_picking_lines_qyts = []

    for move_line_id, move_line in zip(stock_pickig_details["move_lines"], stock_pickig_details["move_line_ids"]):
        stock_pickig_line = list(filter(lambda x: x["id"] == move_line, stock_pickig_lines))
        if len(stock_pickig_line) != 1: raise Exception(f"found none or more than one stock_picking_line: len={len(stock_pickig_line)}")
        else:
            # convert list to dict
            stock_pickig_line = stock_pickig_line[0]
            product_id = stock_pickig_line["product_id"][0]
            qty_done = stock_pickig_line["product_uom_qty"]
        stock_picking_lines_qyts.append({
            "product_product_id": product_id,
            "move_line": move_line,
            "move_line_id": move_line_id,
            "qty_done": qty_done
        })

    for stock_picking_line_qty in stock_picking_lines_qyts:
        dict_model = json.loads(json_model)
        dict_model["params"]["kwargs"]["context"]["uid"] = uid
        dict_model["params"]["args"][0] = stock_picking_line_qty["move_line_id"]
        dict_model["params"]["args"][1]["move_line_ids"][0][1] = stock_picking_line_qty["move_line"]
        dict_model["params"]["args"][1]["move_line_ids"][0][2]["qty_done"] = stock_picking_line_qty["qty_done"]
        dict_model["params"]["kwargs"]["context"]["active_id"] = stock_picking_line_qty["move_line_id"]
        dict_model["params"]["kwargs"]["context"]["active_ids"][0] = stock_picking_line_qty["move_line_id"]
        stock_picking_line_result = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    print("15. updated quantities done")


    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "stock.picking",
            "method": "button_validate",
            "context_id": 1,
            "domain_id": false,
            "args": [
                [
                    195218
                ],
                {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "contact_display": "partner_address",
                    "params": {
                        "action": 246,
                        "allow_none": true
                    }
                }
            ]
        },
        "id": 547648216
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["args"][1]["uid"] = uid
    dict_model["params"]["args"][0][0] = stock_picking_result["res_id"]
    # dict_model["params"]["args"][1]["active_id"] = stock_move[0]["id"]
    # dict_model["params"]["args"][1]["active_ids"][0] = stock_move[0]["id"]
    try:
        rpc.execute_json_model(dict_model, uid, proxy=proxy)
    except Exception as e:
        # print(e)
        pass
    print("16. validated stock picking lines")


    # TODO: check if stocking picking is done
    json_model = """ {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    2633
                ],
                [
                    "id",
                    "state"
                ]
            ],
            "model": "stock.picking",
            "method": "read",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 1,
                    "params": {
                        "action": 246,
                        "id": 5091,
                        "view_type": "form",
                        "model": "stock.picking",
                        "menu_id": 145,
                        "_push_me": false
                    },
                    "contact_display": "partner_address",
                    "bin_size": true
                }
            }
        },
        "id": 515436733
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0][0] = stock_picking_result["res_id"]
    stock_picking_done = rpc.execute_json_model(dict_model, uid, proxy=proxy)

    if stock_picking_done[0]["state"] == "done":
        print("17. confirmed stock picking return")
    else:
        raise Exception("stock picking return state is not done")

    #endregion

    #region --------- UPDATE LOYALTY POINTS --------- #

    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "args": [
    #             [
    #                 51605
    #             ],
    #             [
    #                 "loyalty_points"
    #             ]
    #         ],
    #         "model": "res.partner",
    #         "method": "read",
    #         "kwargs": {
    #             "context": {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "params": {
    #                     "action": 385
    #                 },
    #                 "bin_size": true
    #             }
    #         }
    #     },
    #     "id": 114136503
    # }
    # """
    # dict_model = json.loads(json_model)
    # dict_model["params"]["kwargs"]["context"]["uid"] = uid
    # dict_model["params"]["args"][0][0] = invoice_details["partner"]["id"]
    # result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # loyalty_points = result_list[0]["loyalty_points"]
    # print("18. get partner's loyalty points")

    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "args": [
    #             [
    #                 51605
    #             ],
    #             {
    #                 "loyalty_points": 20
    #             }
    #         ],
    #         "model": "res.partner",
    #         "method": "write",
    #         "kwargs": {
    #             "context": {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "params": {
    #                     "action": 385
    #                 }
    #             }
    #         }
    #     },
    #     "id": 383760606
    # }
    # """
    # dict_model = json.loads(json_model)
    # dict_model["params"]["kwargs"]["context"]["uid"] = uid
    # dict_model["params"]["args"][0][0] = invoice_details["partner"]["id"]

    # loyalty_points_to_refund = 0
    # for line in _invoice_lines:
    #     loyalty_points_to_refund += (line["qty_refund"] * line["price_unit"] )
    # loyalty_points_to_refund *= 0.03

    # loyalty_points_left = loyalty_points - loyalty_points_to_refund
    # if loyalty_points_left < 0: loyalty_points_left = 0

    # dict_model["params"]["args"][1]["loyalty_points"] = loyalty_points_left
    # result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # print("19. update partner's loyalty points")
    #endregion

    return _result
