import json
import re
from datetime import datetime
from .utils import utils, rpc
from django.conf import settings


def get_invoice(invoice_number, company_ids=None, uid=2):
    if company_ids is None:
        company_ids = [1, 2, 3]
    proxy = rpc.get_proxy()
    invoice_result = {"has_refund": False}

    domain_invoice = [
        ["move_type", "=", "out_invoice"],
        ["company_id", "in", company_ids],
        ["name", "ilike", invoice_number],
    ]
    json_model_invoice = {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "model": "account.move",
            "domain": domain_invoice,
            "fields": ["id"],
            "limit": 1,
            "context": {"lang": "es_PE", "tz": "America/Lima", "uid": uid},
        },
        "id": 479230760,
    }
    result_list = rpc.execute_json_model(json_model_invoice, uid, proxy=proxy)

    if not result_list:
        raise Exception("Invoice not found")

    invoice_id = result_list[0]["id"]
    invoice_result["id"] = invoice_id

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
            "args": [[invoice_id], fields_to_read],
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
    invoice_details = result_list[0]
    invoice_details["create_date"] = utils.get_invoice_datetime_format(
        invoice_details["create_date"]
    )
    invoice_details["name"] = invoice_details["name"].replace("\u200b", "")

    # CONSULTA DE PAGOS: Buscar pagos relacionados con la factura
    domain_payments = [["move_id", "=", invoice_id], ["company_id", "in", company_ids]]
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

    invoice_result["payments"] = payments

    # PROCESAR INFORMACIÓN DEL DIARIO
    journal_info = invoice_details.get("journal_id")
    if journal_info and len(journal_info) > 1:
        if "Boleta" in journal_info[1]:
            invoice_result["journal"] = "Boleta de Venta Electrónica"
        elif "Factura" in journal_info[1]:
            invoice_result["journal"] = "Factura Electrónica"
        else:
            invoice_result["journal"] = journal_info[1]

    # ESTRUCTURA FINAL DE RESPUESTA
    invoice_result.update(
        {
            "name": invoice_details["name"],
            "create_date": invoice_details["create_date"],
            "invoice_date": invoice_details["invoice_date"],
            "journal_id": invoice_details["journal_id"],
            "amount_untaxed": invoice_details["amount_untaxed"],
            "amount_total": invoice_details["amount_total"],
            "user": invoice_details.get("user_id", ["", ""])[1],
            "currency": invoice_details.get("currency_id", ["", ""])[1],
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
    dict_model["params"]["args"][0][0] = invoice_details["partner_id"][0]
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    partner_details = result_list[0]

    invoice_result["partner"] = {
        "id": invoice_details["partner_id"][0],
        "name": invoice_details["partner_id"][1],
        "doc_number": partner_details["vat"],
        "odoo_link": f"{settings.ODOO_URL}/web#id={invoice_details['partner_id'][0]}&cids=1-2-3&menu_id=117&model=res.partner&view_type=form",
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
    dict_model["params"]["domain"][1][2] = invoice_id
    refund_invoices = rpc.execute_json_model(dict_model, uid, proxy=proxy)

    if len(refund_invoices) > 0:
        invoice_result["has_refund"] = True
    for refund in refund_invoices:
        refund["create_date"] = utils.get_invoice_datetime_format(refund["create_date"])
        refund["odoo_link"] = (
            f"{settings.ODOO_URL}/web#id={refund['id']}&cids=1-2-3&menu_id=174&action=341&active_id=5&model=stock.picking&view_type=form"
        )
        if not refund["number"]:
            refund["number"] = "BORRADOR"
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
    dict_model["params"]["domain"][0][2] = invoice_details["name"]
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
    invoice_result["stock_moves"] = stock_moves

    invoice_result["lines"] = []
    for line in invoice_lines:
        match = re.search("(\\[.*\\]\\s)?(.*)", line["name"])
        if not match:
            raise Exception(f"could not find regex pattern for: {line['name']}")
        invoice_result["lines"].append(
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

    return invoice_result


def invoice_refund(invoice_details, accion):
    uid = 2
    proxy = rpc.get_proxy()
    _invoice_id = invoice_details["id"]
    today = datetime.now().strftime("%Y-%m-%d")

    json_model = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [
                    [_invoice_id],
                    ["state", "partner_id", "invoice_line_ids", "name", "company_id"],
                ],
                "model": "account.move",
                "method": "read",
                "kwargs": {
                    "context": {"lang": "es_PE", "tz": "America/Lima", "uid": uid}
                },
            },
            "id": 123456,
        }
    )

    response = rpc.execute_json_model(json.loads(json_model), uid, proxy=proxy)
    if (
        not response
        or not response[0].get("state")
        or not response[0].get("partner_id")
        or not response[0].get("invoice_line_ids")
    ):
        print(f"Error: No se pudo obtener la información de la factura {_invoice_id}.")
        return None

    invoice_state = response[0]["state"]
    partner_id = response[0]["partner_id"][0]
    line_ids = response[0]["invoice_line_ids"]
    invoice_number = response[0].get("name", "Factura desconocida") or ""
    invoice_number = invoice_number.replace("\u200b", "")
    company_id = response[0].get("company_id", [0])[0] or 0

    # Determinar el journal_id basado en el número de boleta
    journal_mapping = {
        **dict.fromkeys(
            ["B001", "B002", "B003", "B004", "B005", "B006", "B007", "B008", "B009"], 37
        ),
        "B010": 38,
        **dict.fromkeys(["B011", "B012", "B013"], 39),
        **dict.fromkeys(
            ["F001", "F002", "F003", "F004", "F005", "F006", "F007", "F008", "F009"], 95
        ),
        "F010": 96,
        **dict.fromkeys(["F011", "F012", "F013"], 97),
    }

    journal_id = next(
        (
            jid
            for prefix, jid in journal_mapping.items()
            if invoice_number.startswith(prefix)
        ),
        None,
    )

    if journal_id is None:
        print(f"Error: No se pudo determinar el journal_id para {invoice_number}.")
        return None

    l10n_latam_document_type_id = 8 if journal_id in (37, 38, 39) else 7

    if not line_ids:
        print(f"Error: La factura {_invoice_id} no tiene líneas de productos.")
        return None

    # Si la factura no está en 'draft', simplemente informamos que no lo está y continuamos.
    if invoice_state != "draft":
        print(
            f"La factura {_invoice_id} no está en 'draft'. Se creará la nota de crédito de todas formas."
        )

    selected_line_ids = [
        line["id"] for line in invoice_details["lines"] if line["qty_refund"] > 0
    ]

    if not selected_line_ids:
        print(
            f"Error: No se seleccionaron productos para la nota de crédito de la factura {_invoice_id}."
        )
        return None

    json_model = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [
                    selected_line_ids,
                    [
                        "product_id",
                        "quantity",
                        "price_unit",
                        "price_subtotal",
                        "discount",
                        "tax_ids",
                    ],
                ],
                "model": "account.move.line",
                "method": "read",
                "kwargs": {
                    "context": {"lang": "es_PE", "tz": "America/Lima", "uid": 1}
                },
            },
            "id": 7891011,
        }
    )

    lines_response = rpc.execute_json_model(json.loads(json_model), uid, proxy=proxy)
    if not lines_response:
        print(
            f"Error: No se pudieron recuperar las líneas de la factura {_invoice_id}."
        )
        return None

    credit_note_lines = []
    for line in lines_response:
        discount = line.get("discount", 0) or 0
        qty = line.get("quantity", 1)
        subtotal = line.get("price_subtotal", 0)
        if discount > 0 and qty:
            unit_price = round(subtotal / qty, 2)
        else:
            unit_price = line.get("price_unit", 0)

        credit_note_lines.append(
            (
                0,
                0,
                {
                    "product_id": line["product_id"][0],
                    "quantity": qty,
                    "price_unit": unit_price,
                    "tax_ids": [(6, 0, line.get("tax_ids", []))],
                },
            )
        )

    reason_text = "DEVOLUCIÓN"
    ref_text = f"Reversión de: {invoice_number}, {reason_text}"

    json_model = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [
                    {
                        "move_type": "out_refund",
                        "invoice_date": today,
                        "reversed_entry_id": _invoice_id,
                        "partner_id": partner_id,
                        "invoice_line_ids": credit_note_lines,
                        "ref": ref_text,
                        "journal_id": journal_id,
                        "l10n_latam_document_type_id": l10n_latam_document_type_id,
                        "company_id": company_id,
                        "l10n_pe_edi_refund_reason": "01",
                    }
                ],
                "model": "account.move",
                "method": "create",
                "kwargs": {
                    "context": {
                        "lang": "es_PE",
                        "tz": "America/Lima",
                        "uid": 1,
                        "active_model": "account.move",
                    }
                },
            },
            "id": 197622839,
        }
    )

    refund_id = rpc.execute_json_model(json.loads(json_model), uid, proxy=proxy)
    if refund_id is None:
        print(
            f"Error: No se pudo crear la nota de crédito para la factura {_invoice_id}."
        )
        return None

    json_model = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [[refund_id]],
                "model": "account.move",
                "method": "action_post",
                "kwargs": {
                    "context": {"lang": "es_PE", "tz": "America/Lima", "uid": 1}
                },
            },
            "id": 456789,
        }
    )

    validation_response = rpc.execute_json_model(
        json.loads(json_model), uid, proxy=proxy
    )
    if validation_response is None:
        print(f"Error: No se pudo validar la nota de crédito {refund_id}.")
        return None

    # print(f"Nota de crédito {refund_id} validada correctamente.")

    json_model = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [[refund_id], ["invoice_line_ids", "name", "create_date"]],
                "model": "account.move",
                "method": "read",
                "kwargs": {
                    "context": {"lang": "es_PE", "tz": "America/Lima", "uid": 1}
                },
            },
            "id": 376032110,
        }
    )

    result_list = rpc.execute_json_model(json.loads(json_model), uid, proxy=proxy)
    refund_invoice_details = result_list[0]
    # print("Detalles de la nota de crédito obtenidos.")

    json_model = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [refund_invoice_details["invoice_line_ids"], ["product_id"]],
                "model": "account.move.line",
                "method": "read",
                "kwargs": {
                    "context": {"lang": "es_PE", "tz": "America/Lima", "uid": 1}
                },
            },
            "id": 560055223,
        }
    )

    refund_invoice_lines = rpc.execute_json_model(
        json.loads(json_model), uid, proxy=proxy
    )

    refund_lines_update = []
    for line, r_line in zip(lines_response, refund_invoice_lines):
        if line["product_id"][0] != r_line["product_id"][0]:
            raise Exception(
                f"Las líneas no coinciden para el producto con ID: {line['product_id']}"
            )
        qty_refund = line.get("qty_refund", line.get("quantity", 0))
        price_subtotal_refund = line.get(
            "price_subtotal_refund", line.get("price_subtotal", 0)
        )
        discount = line.get("discount", 0)
        price_subtotal = line.get("price_subtotal", 0)
        if qty_refund == line["quantity"] and price_subtotal == price_subtotal_refund:
            line_update = [4, r_line["id"], False]
        elif qty_refund > 0:
            price_unit = price_subtotal_refund / qty_refund if qty_refund else 0
            if discount > 0:
                price_unit *= 100 / (100 - discount)
            line_update = [
                1,
                r_line["id"],
                {
                    "quantity": qty_refund,
                    "price_unit": price_unit,
                    "tax_ids": [(6, 0, r_line.get("tax_ids", []))],
                },
            ]
        elif qty_refund == 0:
            line_update = [2, r_line["id"], False]
        refund_lines_update.append(line_update)

    json_model = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [[refund_id], {"invoice_line_ids": refund_lines_update}],
                "model": "account.move",
                "method": "write",
                "kwargs": {
                    "context": {"lang": "es_PE", "tz": "America/Lima", "uid": 1}
                },
            },
            "id": 325808041,
        }
    )

    result_list = rpc.execute_json_model(json.loads(json_model), uid, proxy=proxy)
    if not result_list:
        raise Exception("No se pudieron actualizar las líneas de la nota de crédito.")

    # print("Líneas de la nota de crédito actualizadas correctamente.")
    json_model = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [[refund_id], ["name", "create_date"]],
                "model": "account.move",
                "method": "read",
                "kwargs": {
                    "context": {
                        "lang": "es_PE",
                        "tz": "America/Lima",
                        "uid": uid,
                        "default_type": "out_invoice",
                        "type": "out_invoice",
                        "is_company": True,
                        "is_customer": True,
                        "flat_all": True,
                        "params": {"action": 388},
                        "bin_size": True,
                    }
                },
            },
            "id": 376032110,
        }
    )
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    if not result_list:
        print("Error: No se pudo leer la nota de crédito.")
        return None
    refund_invoice_details = result_list[0]
    # print(f"04.1 Nota de crédito leída: {refund_invoice_details}")

    # --- Paso 3: (Opcional) Mostrar o guardar datos del refund ---
    _result = {"refund_invoice": {}}
    _result["refund_invoice"]["id"] = refund_id
    _result["refund_invoice"]["number"] = refund_invoice_details["name"]
    _result["refund_invoice"]["create_date"] = utils.get_invoice_datetime_format(
        refund_invoice_details["create_date"]
    )
    _result["refund_invoice"][
        "odoo_link"
    ] = f"{settings.ODOO_URL}/web#id={refund_id}&cids=1-2-3&menu_id=117&action=244&model=account.move&view_type=form"

    # --- Paso 4: Preparar los datos para el wizard de pago ---
    json_model = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [
                    [refund_id],
                    [
                        "partner_id",
                        "amount_total",
                        "currency_id",
                        "invoice_date",
                        "payment_reference",
                    ],
                ],
                "model": "account.move",
                "method": "read",
                "kwargs": {
                    "context": {
                        "lang": "es_PE",
                        "tz": "America/Lima",
                        "uid": uid,
                        "params": {
                            "action": 388,
                            "id": refund_id,
                            "view_type": "form",
                            "model": "account.move",
                            "menu_id": 83,
                            "_push_me": False,
                        },
                        "default_type": "out_invoice",
                        "type": "out_invoice",
                        "is_company": True,
                        "is_customer": True,
                        "flat_all": True,
                        "bin_size": True,
                    }
                },
            },
            "id": 81282507,
        }
    )
    dict_model = json.loads(json_model)
    dict_model["params"]["kwargs"]["context"]["uid"] = uid
    dict_model["params"]["args"][0][0] = refund_id
    dict_model["params"]["kwargs"]["context"]["params"]["id"] = refund_id
    refund_fields = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # print("05. invoice refund fields:", refund_fields)

    if not refund_fields:
        print("Error: No se pudieron leer los campos de la nota de crédito.")
        return None

    amount_total = refund_fields[0].get("amount_total", 50.00)
    invoice_date = refund_fields[0].get("invoice_date", today)
    payment_reference = refund_fields[0].get(
        "payment_reference", f"Pago de NC {refund_invoice_details['name']}"
    )

    wizard_vals = {
        "payment_date": invoice_date,
        "amount": amount_total,
        "communication": payment_reference,
        "journal_id": 98,
        "payment_type": "outbound",
    }

    wizard_id = None
    result_action = None

    if accion == "pagar":
        # --- Paso 5: Crear el wizard de pago (account.payment.register) ---
        json_wizard_create = json.dumps(
            {
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "model": "account.payment.register",
                    "method": "create",
                    "args": [wizard_vals],
                    "kwargs": {
                        "context": {
                            "lang": "es_PE",
                            "tz": "America/Lima",
                            "uid": uid,
                            "active_model": "account.move",
                            "active_ids": [refund_id],
                            "active_id": refund_id,
                        }
                    },
                },
                "id": 999999,
            }
        )
        wizard_id = rpc.execute_json_model(
            json.loads(json_wizard_create), uid, proxy=proxy
        )

        if not wizard_id:
            print(
                "Error: No se pudo crear el wizard de pago (account.payment.register)."
            )
        else:
            # --- Paso 6: Confirmar el wizard para crear el pago ---
            json_wizard_action = json.dumps(
                {
                    "jsonrpc": "2.0",
                    "method": "call",
                    "params": {
                        "model": "account.payment.register",
                        "method": "action_create_payments",
                        "args": [[wizard_id]],
                        "kwargs": {},
                    },
                    "id": 999998,
                }
            )
            result_action = rpc.execute_json_model(
                json.loads(json_wizard_action), uid, proxy=proxy
            )
            # print(f"RESULTADO action_create_payments: {result_action}")

    # # --- Paso 5: Crear el wizard de pago (account.payment.register) ---
    # json_wizard_create = json.dumps(
    #     {
    #         "jsonrpc": "2.0",
    #         "method": "call",
    #         "params": {
    #             "model": "account.payment.register",
    #             "method": "create",
    #             "args": [wizard_vals],
    #             "kwargs": {
    #                 "context": {
    #                     "lang": "es_PE",
    #                     "tz": "America/Lima",
    #                     "uid": uid,
    #                     "active_model": "account.move",
    #                     "active_ids": [refund_id],
    #                     "active_id": refund_id,
    #                 }
    #             },
    #         },
    #         "id": 999999,
    #     }
    # )
    # wizard_id = rpc.execute_json_model(json.loads(json_wizard_create), uid, proxy=proxy)
    # if not wizard_id:
    #     print("Error: No se pudo crear el wizard de pago (account.payment.register).")
    #     return None
    # # print(f"WIZARD DE PAGO CREADO: {wizard_id}")

    # # --- Paso 6: Confirmar el wizard para crear el pago ---
    # json_wizard_action = json.dumps(
    #     {
    #         "jsonrpc": "2.0",
    #         "method": "call",
    #         "params": {
    #             "model": "account.payment.register",
    #             "method": "action_create_payments",
    #             "args": [[wizard_id]],
    #             "kwargs": {},
    #         },
    #         "id": 999998,
    #     }
    # )
    # result_action = rpc.execute_json_model(
    #     json.loads(json_wizard_action), uid, proxy=proxy
    # )
    # # print(f"RESULTADO action_create_payments: {result_action}")

    # endregion
    # region --------- UPDATE STOCK INVENTORY --------- #

    # 1. Leer las líneas de la nota de crédito directamente desde account.move.line
    if company_id == 1:  # ABTAO
        ORIGIN_LOCATION_ID = 5
        DEST_LOCATION_ID = 8
        RETURN_PICKING_TYPE_ID = 1
    elif company_id == 3:  # SAN MARTIN
        ORIGIN_LOCATION_ID = 5
        DEST_LOCATION_ID = 32
        RETURN_PICKING_TYPE_ID = 13
    elif company_id == 2:  # TINGO MARIA
        ORIGIN_LOCATION_ID = 5
        DEST_LOCATION_ID = 22
        RETURN_PICKING_TYPE_ID = 7
    else:
        raise Exception("La empresa de la factura no tiene mapeo de almacén definido.")

    json_model_lines = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [[refund_id], ["invoice_line_ids"]],
                "model": "account.move",
                "method": "read",
                "kwargs": {
                    "context": {"lang": "es_PE", "tz": "America/Lima", "uid": uid}
                },
            },
            "id": 111111,
        }
    )
    result_lines = rpc.execute_json_model(
        json.loads(json_model_lines), uid, proxy=proxy
    )
    if not result_lines:
        raise Exception("No se pudieron leer las líneas de la nota de crédito.")
    refund_line_ids = result_lines[0].get("invoice_line_ids", [])
    if not refund_line_ids:
        raise Exception("La nota de crédito no tiene líneas de productos.")

    # 2. Leer detalles de esas líneas desde account.move.line
    json_model_move_lines = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [
                    refund_line_ids,
                    ["product_id", "quantity", "price_unit", "price_subtotal"],
                ],
                "model": "account.move.line",
                "method": "read",
                "kwargs": {
                    "context": {"lang": "es_PE", "tz": "America/Lima", "uid": uid}
                },
            },
            "id": 222222,
        }
    )
    move_lines = rpc.execute_json_model(
        json.loads(json_model_move_lines), uid, proxy=proxy
    )
    if not move_lines:
        raise Exception(
            "No se pudieron leer los detalles de las líneas de la nota de crédito."
        )

    # 3. Crear el Stock Picking de devolución
    picking_vals = {
        "name": "/",
        "origin": refund_invoice_details["name"],
        "partner_id": partner_id,
        "picking_type_id": RETURN_PICKING_TYPE_ID,
        "location_id": ORIGIN_LOCATION_ID,
        "location_dest_id": DEST_LOCATION_ID,
        "company_id": refund_invoice_details.get("company_id", False),
    }
    json_picking = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "model": "stock.picking",
                "method": "create",
                "args": [picking_vals],
                "kwargs": {
                    "context": {"lang": "es_PE", "tz": "America/Lima", "uid": uid}
                },
            },
            "id": 111112,
        }
    )
    picking_id = rpc.execute_json_model(json.loads(json_picking), uid, proxy=proxy)
    if not picking_id:
        raise Exception("No se pudo crear el stock picking de devolución.")
    print("Stock picking creado:", picking_id)

    # 4. Crear los Stock Moves y asignarles el picking_id creado
    created_stock_moves = []
    for line in lines_response:
        product_id = line["product_id"][0]
        quantity = line["quantity"]

        json_read_product = json.dumps(
            {
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "model": "product.product",
                    "method": "read",
                    "args": [[product_id], ["uom_id"]],
                    "kwargs": {"context": {"uid": uid}},
                },
                "id": 100002,
            }
        )
        product_data = rpc.execute_json_model(
            json.loads(json_read_product), uid, proxy=proxy
        )
        if not product_data:
            raise Exception(f"No se pudo leer el product.product con ID {product_id}")
        uom_id = product_data[0]["uom_id"][0]

        move_vals = {
            "name": f"Devolución de {refund_invoice_details['name']}",
            "picking_id": picking_id,
            "partner_id": partner_id,
            "product_id": product_id,
            "product_uom_qty": quantity,
            "product_uom": uom_id,
            "location_id": ORIGIN_LOCATION_ID,
            "location_dest_id": DEST_LOCATION_ID,
            "picking_type_id": RETURN_PICKING_TYPE_ID,
            "company_id": company_id,
            "origin": refund_invoice_details["name"],
        }

        json_move = json.dumps(
            {
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "model": "stock.move",
                    "method": "create",
                    "args": [move_vals],
                    "kwargs": {"context": {"uid": uid}},
                },
                "id": 100003,
            }
        )
        move_id = rpc.execute_json_model(json.loads(json_move), uid, proxy=proxy)
        if move_id:
            created_stock_moves.append(move_id)
        else:
            print(f"Error al crear stock.move para product_id={product_id}")

    # 3) Confirmar, asignar y validar el picking
    json_confirm = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "model": "stock.picking",
                "method": "action_confirm",
                "args": [[picking_id]],
                "kwargs": {"context": {"uid": uid}},
            },
            "id": 100004,
        }
    )
    rpc.execute_json_model(json.loads(json_confirm), uid, proxy=proxy)

    json_assign = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "model": "stock.picking",
                "method": "action_assign",
                "args": [[picking_id]],
                "kwargs": {"context": {"uid": uid}},
            },
            "id": 100005,
        }
    )
    rpc.execute_json_model(json.loads(json_assign), uid, proxy=proxy)

    json_validate = json.dumps(
        {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "model": "stock.picking",
                "method": "button_validate",
                "args": [[picking_id]],
                "kwargs": {"context": {"uid": uid}},
            },
            "id": 100006,
        }
    )
    rpc.execute_json_model(json.loads(json_validate), uid, proxy=proxy)

    return {
        "refund_invoice": {
            "id": refund_id,
            "number": refund_invoice_details["name"],
            "create_date": refund_invoice_details["create_date"],
            "odoo_link": f"{settings.ODOO_URL}/web#id={refund_id}&cids=1-2-3&menu_id=117&action=244&model=account.move&view_type=form",
        },
        "payment_wizard_id": wizard_id if wizard_id else None,
        "payment_result": result_action if result_action else None,
    }

    # # 5. Confirmar y validar el Picking (para que los movimientos queden en estado 'done')
    # json_confirm = json.dumps({
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "model": "stock.picking",
    #         "method": "action_confirm",
    #         "args": [[picking_id]],
    #         "kwargs": {"context": {"lang": "es_PE", "tz": "America/Lima", "uid": uid}}
    #     },
    #     "id": 403748289
    # })
    # result_confirm = rpc.execute_json_model(json.loads(json_confirm), uid, proxy=proxy)
    # print("Picking confirmado:", result_confirm)

    # json_assign = json.dumps({
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "model": "stock.picking",
    #         "method": "action_assign",
    #         "args": [[picking_id]],
    #         "kwargs": {"context": {"lang": "es_PE", "tz": "America/Lima", "uid": uid}}
    #     },
    #     "id": 403748290
    # })
    # result_assign = rpc.execute_json_model(json.loads(json_assign), uid, proxy=proxy)
    # print("Picking asignado:", result_assign)

    # json_validate = json.dumps({
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "model": "stock.picking",
    #         "method": "button_validate",
    #         "args": [[picking_id]],
    #         "kwargs": {"context": {"lang": "es_PE", "tz": "America/Lima", "uid": uid}}
    #     },
    #     "id": 403748291
    # })
    # result_validate = rpc.execute_json_model(json.loads(json_validate), uid, proxy=proxy)
    # if not result_validate:
    #     raise Exception("No se pudo validar el picking de devolución.")
    # print("Picking validado:", result_validate)

    # # 6. Usar el wizard de 'Return Picking' para procesar la devolución
    # # Primero, obtenemos los valores por defecto del wizard:
    # json_wizard_defaults = json.dumps({
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "model": "stock.return.picking",
    #         "method": "default_get",
    #         "args": [["product_return_moves", "parent_location_id", "original_location_id", "location_id"]],
    #         "kwargs": {
    #             "context": {
    #                 "active_model": "stock.picking",
    #                 "active_ids": [picking_id],
    #                 "active_id": picking_id,
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": uid,
    #             }
    #         },
    #     },
    #     "id": 999997
    # })
    # wizard_defaults = rpc.execute_json_model(json.loads(json_wizard_defaults), uid, proxy=proxy)
    # print("Wizard defaults:", wizard_defaults)

    # # Aquí debemos construir el diccionario 'product_return_moves'
    # # Por ejemplo, para cada línea del picking (en este ejemplo, se filtran según la nota de crédito):
    # # (Este es un ejemplo básico; ajusta la lógica según tu negocio)
    # product_return_moves = []
    # # Supongamos que tienes las líneas a devolver (podrías filtrar con las cantidades de refund en invoice_result["lines"])
    # # Ejemplo:
    # for line in move_lines:
    #     product_id = line["product_id"][0]
    #     # Se asume que la cantidad a devolver es la misma de la línea:
    #     qty_to_return = line["quantity"]
    #     # Debes relacionar el movimiento de stock (move_id) con esta línea; aquí se usa un placeholder.
    #     # Ajusta según cómo obtengas el move_line_id.
    #     # Por ejemplo, si created_stock_moves y move_lines están en el mismo orden:
    #     move_line_placeholder = created_stock_moves[move_lines.index(line)]
    #     product_return_moves.append([0, f"virtual_{product_id}", {
    #         "product_id": product_id,
    #         "quantity": qty_to_return,
    #         "to_refund": False,
    #         "move_id": move_line_placeholder  # Asegúrate de relacionar el movimiento correcto
    #     }])

    # # Actualizar los valores por defecto con los datos de devolución:
    # wizard_vals = {
    #     "product_return_moves": product_return_moves,
    #     "parent_location_id": ORIGIN_LOCATION_ID,
    #     "original_location_id": ORIGIN_LOCATION_ID,
    #     "location_id": ORIGIN_LOCATION_ID,
    # }

    # Crear el wizard de return picking
    # json_wizard_create = json.dumps({
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "model": "stock.return.picking",
    #         "method": "create",
    #         "args": [wizard_vals],
    #         "kwargs": {
    #             "context": {
    #                 "active_model": "stock.picking",
    #                 "active_ids": [picking_id],
    #                 "active_id": picking_id,
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": uid,
    #             }
    #         },
    #     },
    #     "id": 999999
    # })
    # wizard_id = rpc.execute_json_model(json.loads(json_wizard_create), uid, proxy=proxy)
    # if not wizard_id:
    #     raise Exception("Error: No se pudo crear el wizard de return picking.")
    # print("Wizard de return picking creado:", wizard_id)

    # # Llamar al método 'create_returns' del wizard para procesar la devolución
    # json_wizard_action = json.dumps({
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "model": "stock.return.picking",
    #         "method": "create_returns",
    #         "args": [[wizard_id]],
    #         "kwargs": {},
    #     },
    #     "id": 999998
    # })
    # result_action = rpc.execute_json_model(json.loads(json_wizard_action), uid, proxy=proxy)
    # print("Resultado create_returns:", result_action)

    # return {
    #     "refund_invoice": {
    #         "id": refund_id,
    #         "number": refund_invoice_details["name"],
    #         "create_date": refund_invoice_details["create_date"],
    #         "odoo_link": f"{settings.ODOO_URL}/web#id={refund_id}&view_type=form&model=account.move&menu_id=83&action=388"
    #     },
    #     "picking_id": picking_id,
    #     "stock_moves": created_stock_moves,
    #     "return_wizard_id": wizard_id,
    #     "return_result": result_action,
    # }
    # ************************************************************************************************
    # json_model = """ {
    #      "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "args": [
    #             [
    #                 193814
    #             ],
    #             [
    #                 "id",
    #                 "move_line_ids",
    #                 "location_id",
    #                 "location_dest_id"
    #             ]
    #         ],
    #         "model": "stock.picking",
    #         "method": "read",
    #         "kwargs": {
    #             "context": {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "contact_display": "partner_address",
    #                 "params": {
    #                     "action": 246
    #                 },
    #                 "bin_size": true
    #             }
    #         }
    #     },
    #     "id": 403748289
    # }
    # """
    # dict_model = json.loads(json_model)
    # dict_model["params"]["kwargs"]["context"]["uid"] = uid
    # dict_model["params"]["args"][0][0] = stock_move[0]["id"]
    # result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # stock_move_result = result_list[0]
    # print("09. found stock move result")

    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "args": [
    #             [
    #                 572775,
    #                 572776,
    #                 572777,
    #                 572778,
    #                 572779
    #             ],
    #             [
    #                 "product_id",
    #                 "move_id",
    #                 "qty_done"
    #             ]
    #         ],
    #         "model": "stock.move.line",
    #         "method": "read",
    #         "kwargs": {
    #             "context": {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "contact_display": "partner_address",
    #                 "params": {
    #                     "action": 246
    #                 },
    #                 "default_picking_id": 193814,
    #                 "default_location_id": 30,
    #                 "default_location_dest_id": 9
    #             }
    #         }
    #     },
    #     "id": 219341866
    # }
    # """
    # dict_model = json.loads(json_model)
    # dict_model["params"]["kwargs"]["context"]["uid"] = uid
    # dict_model["params"]["args"][0] = stock_move_result["move_line_ids"]
    # dict_model["params"]["kwargs"]["context"]["default_picking_id"] = stock_move_result[
    #     "id"
    # ]
    # dict_model["params"]["kwargs"]["context"]["default_location_id"] = (
    #     stock_move_result["location_id"][0]
    # )
    # dict_model["params"]["kwargs"]["context"]["default_location_dest_id"] = (
    #     stock_move_result["location_dest_id"][0]
    # )
    # move_line_ids = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # print("10. found stock move line ids")

    # # json_model = """ {
    # #     "jsonrpc": "2.0",
    # #     "method": "call",
    # #     "params": {
    # #         "args": [
    # #             [
    # #                 "move_dest_exists",
    # #                 "product_return_moves",
    # #                 "parent_location_id",
    # #                 "original_location_id",
    # #                 "location_id"
    # #             ]
    # #         ],
    # #         "model": "stock.return.picking",
    # #         "method": "default_get",
    # #         "kwargs": {
    # #             "context": {
    # #                 "lang": "es_PE",
    # #                 "tz": "America/Lima",
    # #                 "uid": 1,
    # #                 "contact_display": "partner_address",
    # #                 "params": {
    # #                     "action": 246
    # #                 },
    # #                 "active_model": "stock.picking",
    # #                 "active_id": 190454,
    # #                 "active_ids": [
    # #                     190454
    # #                 ],
    # #                 "search_disable_custom_filters": true
    # #             }
    # #         }
    # #     },
    # #     "id": 63956484
    # # }
    # # """
    # # dict_model = json.loads(json_model)
    # # dict_model["params"]["kwargs"]["context"]["uid"] = uid
    # # dict_model["params"]["kwargs"]["context"]["active_id"] = stock_move_result["id"]
    # # dict_model["params"]["kwargs"]["context"]["active_ids"][0] = stock_move_result["id"]
    # # stock_return_picking_locations = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # # print(f"10.1 found stock return picking locations:\n{stock_return_picking_locations}")

    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "args": [
    #             {
    #                 "product_return_moves": [
    #                     [
    #                         0,
    #                         "virtual_22393",
    #                         {
    #                             "product_id": 119101,
    #                             "quantity": 1,
    #                             "to_refund": false,
    #                             "move_id": 574964
    #                         }
    #                     ],
    #                     [
    #                         0,
    #                         "virtual_22401",
    #                         {
    #                             "product_id": 121107,
    #                             "quantity": 7,
    #                             "to_refund": false,
    #                             "move_id": 574966
    #                         }
    #                     ],
    #                     [
    #                         0,
    #                         "virtual_22405",
    #                         {
    #                             "product_id": 117092,
    #                             "quantity": 1,
    #                             "to_refund": false,
    #                             "move_id": 574967
    #                         }
    #                     ],
    #                     [
    #                         0,
    #                         "virtual_22409",
    #                         {
    #                             "product_id": 117740,
    #                             "quantity": 1,
    #                             "to_refund": false,
    #                             "move_id": 574968
    #                         }
    #                     ]
    #                 ],
    #                 "parent_location_id": 11,
    #                 "original_location_id": 30,
    #                 "location_id": 30
    #             }
    #         ],
    #         "model": "stock.return.picking",
    #         "method": "create",
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
    #                 "active_id": 193814,
    #                 "active_ids": [
    #                     193814
    #                 ],
    #                 "search_disable_custom_filters": true
    #             }
    #         }
    #     },
    #     "id": 435986473
    # }
    # """
    # dict_model = json.loads(json_model)
    # dict_model["params"]["kwargs"]["context"]["uid"] = uid
    # product_return_moves = []

    # # we sort out lines with no refund when we have lines with same product id
    # invoice_lines_to_refund = [
    #     line for line in _invoice_lines if line["qty_refund"] > 0
    # ]
    # # sort both list by product id so they math when looping
    # invoice_lines_to_refund.sort(key=lambda x: x["product_id"])
    # invoice_lines_to_refund_product_ids = [
    #     line["product_id"] for line in invoice_lines_to_refund
    # ]
    # move_line_ids = list(
    #     filter(
    #         lambda x: x["product_id"][0] in invoice_lines_to_refund_product_ids,
    #         move_line_ids,
    #     )
    # )
    # move_line_ids.sort(key=lambda x: x["product_id"][0])

    # virtual = 22400  # just because TODO: use random
    # for move_line, refund_line in zip(move_line_ids, invoice_lines_to_refund):
    #     if move_line["qty_done"] % 1 > 0:
    #         raise Exception("qty is not an integer number")
    #     return_move = {
    #         "product_id": move_line["product_id"][0],
    #         "quantity": refund_line["qty_refund"],
    #         "to_refund": False,
    #         "move_id": move_line["move_id"][0],
    #     }
    #     virtual += 10
    #     product_return_moves.append([0, f"virtual_{virtual}", return_move])

    # dict_model["params"]["args"][0]["product_return_moves"] = product_return_moves
    # dict_model["params"]["args"][0]["parent_location_id"] = _parent_location_id
    # dict_model["params"]["args"][0]["original_location_id"] = _original_location_id
    # dict_model["params"]["args"][0]["location_id"] = _original_location_id
    # dict_model["params"]["kwargs"]["context"]["active_id"] = stock_move[0]["id"]
    # dict_model["params"]["kwargs"]["context"]["active_ids"][0] = stock_move[0]["id"]
    # stock_return_picking_id = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # print("11. stock return picking done")

    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "model": "stock.return.picking",
    #         "method": "create_returns",
    #         "domain_id": null,
    #         "context_id": 1,
    #         "args": [
    #             [
    #                 4843
    #             ],
    #             {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "contact_display": "partner_address",
    #                 "params": {
    #                     "action": 246
    #                 },
    #                 "active_model": "stock.picking",
    #                 "active_id": 193814,
    #                 "active_ids": [
    #                     193814
    #                 ],
    #                 "search_disable_custom_filters": true
    #             }
    #         ]
    #     },
    #     "id": 571191483
    # }
    # """
    # dict_model = json.loads(json_model)
    # dict_model["params"]["args"][1]["uid"] = uid
    # dict_model["params"]["args"][0][0] = stock_return_picking_id
    # dict_model["params"]["args"][1]["active_id"] = stock_move[0]["id"]
    # dict_model["params"]["args"][1]["active_ids"][0] = stock_move[0]["id"]
    # stock_picking_result = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # print("12. stock return picking call_button done")

    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "args": [
    #             [
    #                 195222
    #             ],
    #             [
    #                 "id",
    #                 "location_id",
    #                 "location_dest_id",
    #                 "move_line_ids",
    #                 "move_lines",
    #                 "create_date",
    #                 "name"
    #             ]
    #         ],
    #         "model": "stock.picking",
    #         "method": "read",
    #         "kwargs": {
    #             "context": {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "contact_display": "partner_address",
    #                 "params": {
    #                     "action": 246
    #                 },
    #                 "bin_size": true
    #             }
    #         }
    #     },
    #     "id": 536512313
    # }
    # """
    # dict_model = json.loads(json_model)
    # dict_model["params"]["kwargs"]["context"]["uid"] = uid
    # dict_model["params"]["args"][0][0] = stock_picking_result["res_id"]
    # result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # stock_pickig_details = result_list[0]
    # print("13. read stock picking details")
    # _result["stock_move"]["id"] = stock_pickig_details["id"]
    # _result["stock_move"]["number"] = stock_pickig_details["name"]
    # _result["stock_move"]["create_date"] = utils.get_invoice_datetime_format(
    #     stock_pickig_details["create_date"]
    # )
    # _result["stock_move"][
    #     "odoo_link"
    # ] = f"{settings.ODOO_URL}/web#id={stock_pickig_details['id']}&view_type=form&model=stock.picking&action=246&menu_id=145"

    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "args": [
    #             [
    #                 575966,
    #                 575967,
    #                 575968,
    #                 575969
    #             ],
    #             [
    #                 "product_id",
    #                 "product_uom_qty"
    #             ]
    #         ],
    #         "model": "stock.move.line",
    #         "method": "read",
    #         "kwargs": {
    #             "context": {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "contact_display": "partner_address",
    #                 "params": {
    #                     "action": 246
    #                 },
    #                 "default_picking_id": 195222,
    #                 "default_location_id": 9,
    #                 "default_location_dest_id": 30
    #             }
    #         }
    #     },
    #     "id": 715312400
    # }
    # """

    # dict_model = json.loads(json_model)
    # dict_model["params"]["kwargs"]["context"]["uid"] = uid
    # dict_model["params"]["args"][0] = stock_pickig_details["move_line_ids"]
    # dict_model["params"]["kwargs"]["context"]["default_picking_id"] = (
    #     stock_pickig_details["id"]
    # )
    # dict_model["params"]["kwargs"]["context"]["default_location_id"] = (
    #     stock_pickig_details["location_id"]
    # )
    # dict_model["params"]["kwargs"]["context"]["default_location_dest_id"] = (
    #     stock_pickig_details["location_dest_id"]
    # )
    # stock_pickig_lines = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # print("14. read stock picking lines")

    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "args": [
    #             [
    #                 578157
    #             ],
    #             {
    #                 "move_line_ids": [
    #                     [
    #                         1,
    #                         575959,
    #                         {
    #                             "qty_done": 1
    #                         }
    #                     ]
    #                 ]
    #             }
    #         ],
    #         "model": "stock.move",
    #         "method": "write",
    #         "kwargs": {
    #             "context": {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "contact_display": "partner_address",
    #                 "params": {
    #                     "action": 246
    #                 },
    #                 "active_model": "stock.move",
    #                 "active_id": 578157,
    #                 "active_ids": [
    #                     578157
    #                 ],
    #                 "show_lots_m2o": false,
    #                 "show_lots_text": false,
    #                 "show_source_location": "stock.location()",
    #                 "show_destination_location": "stock.location()",
    #                 "show_package": true,
    #                 "show_reserved_quantity": true,
    #                 "search_disable_custom_filters": true
    #             }
    #         }
    #     },
    #     "id": 451695919
    # }
    # """
    # # fields "product_product_id", "move_line", "move_line_id", "qty_done"
    # stock_picking_lines_qyts = []

    # for move_line_id, move_line in zip(
    #     stock_pickig_details["move_lines"], stock_pickig_details["move_line_ids"]
    # ):
    #     stock_pickig_line = list(
    #         filter(lambda x: x["id"] == move_line, stock_pickig_lines)
    #     )
    #     if len(stock_pickig_line) != 1:
    #         raise Exception(
    #             f"found none or more than one stock_picking_line: len={len(stock_pickig_line)}"
    #         )
    #     else:
    #         # convert list to dict
    #         stock_pickig_line = stock_pickig_line[0]
    #         product_id = stock_pickig_line["product_id"][0]
    #         qty_done = stock_pickig_line["product_uom_qty"]
    #     stock_picking_lines_qyts.append(
    #         {
    #             "product_product_id": product_id,
    #             "move_line": move_line,
    #             "move_line_id": move_line_id,
    #             "qty_done": qty_done,
    #         }
    #     )

    # for stock_picking_line_qty in stock_picking_lines_qyts:
    #     dict_model = json.loads(json_model)
    #     dict_model["params"]["kwargs"]["context"]["uid"] = uid
    #     dict_model["params"]["args"][0] = stock_picking_line_qty["move_line_id"]
    #     dict_model["params"]["args"][1]["move_line_ids"][0][1] = stock_picking_line_qty[
    #         "move_line"
    #     ]
    #     dict_model["params"]["args"][1]["move_line_ids"][0][2]["qty_done"] = (
    #         stock_picking_line_qty["qty_done"]
    #     )
    #     dict_model["params"]["kwargs"]["context"]["active_id"] = stock_picking_line_qty[
    #         "move_line_id"
    #     ]
    #     dict_model["params"]["kwargs"]["context"]["active_ids"][0] = (
    #         stock_picking_line_qty["move_line_id"]
    #     )
    #     stock_picking_line_result = rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # print("15. updated quantities done")

    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "model": "stock.picking",
    #         "method": "button_validate",
    #         "context_id": 1,
    #         "domain_id": false,
    #         "args": [
    #             [
    #                 195218
    #             ],
    #             {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "contact_display": "partner_address",
    #                 "params": {
    #                     "action": 246,
    #                     "allow_none": true
    #                 }
    #             }
    #         ]
    #     },
    #     "id": 547648216
    # }
    # """
    # dict_model = json.loads(json_model)
    # dict_model["params"]["args"][1]["uid"] = uid
    # dict_model["params"]["args"][0][0] = stock_picking_result["res_id"]
    # # dict_model["params"]["args"][1]["active_id"] = stock_move[0]["id"]
    # # dict_model["params"]["args"][1]["active_ids"][0] = stock_move[0]["id"]
    # try:
    #     rpc.execute_json_model(dict_model, uid, proxy=proxy)
    # except Exception as e:
    #     # print(e)
    #     pass
    # print("16. validated stock picking lines")

    # # TODO: check if stocking picking is done
    # json_model = """ {
    #     "jsonrpc": "2.0",
    #     "method": "call",
    #     "params": {
    #         "args": [
    #             [
    #                 2633
    #             ],
    #             [
    #                 "id",
    #                 "state"
    #             ]
    #         ],
    #         "model": "stock.picking",
    #         "method": "read",
    #         "kwargs": {
    #             "context": {
    #                 "lang": "es_PE",
    #                 "tz": "America/Lima",
    #                 "uid": 1,
    #                 "params": {
    #                     "action": 246,
    #                     "id": 5091,
    #                     "view_type": "form",
    #                     "model": "stock.picking",
    #                     "menu_id": 145,
    #                     "_push_me": false
    #                 },
    #                 "contact_display": "partner_address",
    #                 "bin_size": true
    #             }
    #         }
    #     },
    #     "id": 515436733
    # }
    # """
    # dict_model = json.loads(json_model)
    # dict_model["params"]["kwargs"]["context"]["uid"] = uid
    # dict_model["params"]["args"][0][0] = stock_picking_result["res_id"]
    # stock_picking_done = rpc.execute_json_model(dict_model, uid, proxy=proxy)

    # if stock_picking_done[0]["state"] == "done":
    #     print("17. confirmed stock picking return")
    # else:
    #     raise Exception("stock picking return state is not done")

    # endregion

    # region --------- UPDATE LOYALTY POINTS --------- #

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
    #       # dict_model = json.loads(json_model)      # dict_model["params"]["kwargs"]["context"]["uid"] = uid      # dict_model["params"]["args"][0][0] = invoice_details["partner"]["id"]      # result_list = rpc.execute_json_model(dict_model, uid, proxy=proxy)      # loyalty_points = result_list[0]["loyalty_points"]      # print("18. get partner's loyalty points")        # json_model = """ {      #     "jsonrpc": "2.0",      #     "method": "call",      #     "params": {      #         "args": [}    #             [""    #                 51605di    #             ],di    #             {di    #                 "loyalty_points": 20re    #             }lo    #         ],pr    #         "model": "res.partner",#     #         "method": "write",js    #         "kwargs": {      #             "context": {      #                 "lang": "es_PE",      #                 "tz": "America/Lima",      #                 "uid": 1,      #                 "params": {      #                     "action": 385      #                 }      #             }      #         }      #     },      #     "id": 383760606      # }
