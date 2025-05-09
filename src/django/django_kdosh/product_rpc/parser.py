import datetime as dt

from django.conf import settings
from .utils.sql import select


def transform_product_json(data):
    transf_obj = []
    for prod in data:
        default_code_map = []
        list_price_map = []
        for attr_dc in prod["attr_default_code"]:
            default_code_map.append(
                {
                    "ids": [
                        attr_val_id["id"] for attr_val_id in attr_dc["attr_val_ids"]
                    ],
                    "default_code": attr_dc["default_code"].strip(),
                }
            )
        for attr_lp in prod["attr_list_price"]:
            list_price_map.append(
                {
                    "ids": [
                        attr_val_id["id"] for attr_val_id in attr_lp["attr_val_ids"]
                    ],
                    "list_price": attr_lp["list_price"],
                }
            )
        category_id = 0
        if prod["category_last_id"]:
            category_id = prod["category_last_id"]
        elif prod["category_brand_id"]:
            category_id = prod["category_brand_id"]
        elif prod["category_family_id"]:
            category_id = prod["category_family_id"]
        product = {
            "name": prod["name"].strip(),
            "default_code": prod["default_code"].strip(),
            "list_price": prod["list_price"],
            # ACA ES DONDE SE TOMA EL ULTIMO VALOR DE LA CATEGORIA
            "categ_id": category_id,
            "pos_categ_ids": (
                [(6, 0, [prod["pos_categ_ids"]])]
                if isinstance(prod["pos_categ_ids"], int)
                else [(6, 0, prod["pos_categ_ids"])]
            ),
            "attribute_line_ids": [],
        }
        for attr in prod["attrs"]:
            product["attribute_line_ids"].append(
                {
                    "attribute_id": attr["attr"]["id"],
                    "value_ids": [attr_val["id"] for attr_val in attr["attr_vals"]],
                }
            )
        transf_obj.append(
            {
                "product": product,
                "default_code_map": default_code_map,
                "list_price_map": list_price_map,
                # not actually a map
                "weight_map": prod["weight"] if prod["weight"] else 0,
                "client_id": prod["id"],
            }
        )

    return transf_obj


def product_stats_get(product_tmpl_ids):
    sql = """
        select odoo_id, client_id
        from rpc_product_stats
        where odoo_id in ({}); 
    """.format(
        ",".join(map(str, product_tmpl_ids))
    )

    print(f"SQL ejecutado: {sql}")
    res = select(sql)
    print(f"Resultados obtenidos: {res}")
    return res


def product_client_result(product_tmpl_ids):
    results = product_stats_get(product_tmpl_ids)
    product_results = []
    for result in results:
        # RESULT TUPLE (odoo_id, client_id)
        product_results.append(
            {
                "odoo_id": result[0],
                "odoo_link": "{}/web#id={}&cids=1-2-3&menu_id=206&action=354&model=product.template&view_type=form".format(
                    settings.ODOO_URL, result[0]
                ),
                "client_id": result[1],
            }
        )
    return product_results


def transform_order_json(data):
    order_lines = []
    total_price = 0
    TAX_ID = 13
    UNTAX_ID = 17
    PERUVIAN_TAX = 0.18

    for order_item in data["order_list"]:
        for product_row in order_item["product_matrix"]:
            for product_item in product_row["product_items"]:
                if product_item["qty"] == 0 or product_item["price"] == 0:
                    continue
                order_lines.append(
                    {
                        "product_id": product_item["id"],
                        "name": product_item["name"],
                        "date_planned": order_item["date"],
                        "product_qty": product_item["qty"],
                        "price_unit": product_item["price"],
                        "tax_id": (
                            TAX_ID if data["order_details"]["is_taxed"] else UNTAX_ID
                        ),
                    }
                )
                total_price += product_item["price"] * product_item["qty"]

    transf_obj = {
        "date_order": dt.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "partner_id": data["order_details"]["partner_id"],
        "partner_ref": data["order_details"]["partner_ref"],
        "company_id": data["order_details"]["company_id"],
        "amount_tax_otros": total_price * PERUVIAN_TAX,
        "order_lines": order_lines,
    }

    return transf_obj


def order_client_result(order_id):
    result = {
        "odoo_link": "{}/web#id={}&cids=1-2-3&menu_id=407&action=599&model=purchase.order&view_type=form".format(
            settings.ODOO_URL, order_id
        ),
        "odoo_id": order_id,
    }
    return result
