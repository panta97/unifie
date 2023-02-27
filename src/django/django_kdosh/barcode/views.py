from xmlrpc import client as xmlrpclib
from datetime import datetime, timedelta
from django.conf import settings
from django.http import JsonResponse
from .rpc import get_model
from functools import reduce


def get_product_product(request, pp_id):
    proxy = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(settings.ODOO_URL))
    # pp = product.product
    pp_table = "product.product"
    pp_filter = [[["id", "=", pp_id]]]
    pp_fields = [
        "barcode",
        "name",
        "description",
        "default_code",
        "categ_id",
        "lst_price",
        "product_template_attribute_value_ids",
        "product_tmpl_id",
    ]
    # GET PRODUCTS WITH FILTERED PRODUCT IDS
    products = get_model(proxy, pp_table, pp_filter, pp_fields)
    tmpl_id = products[0]["product_tmpl_id"][0]

    ptav_table = "product.template.attribute.value"
    ptav_filter = [[["product_tmpl_id", "=", tmpl_id]]]
    ptav_fields = ["product_attribute_value_id"]
    product_template_attribute_value_list = get_model(
        proxy, ptav_table, ptav_filter, ptav_fields
    )

    # FOR v15 WE NOW HAVE AN INTERMEDIARY MODEL 'product.template.attribute.value'
    for pp_item in products:
        product_attribute_value_ids = []
        for ptav_id in pp_item["product_template_attribute_value_ids"]:
            for ptav_item in product_template_attribute_value_list:
                if ptav_id == ptav_item["id"]:
                    product_attribute_value_ids.append(
                        ptav_item["product_attribute_value_id"][0]
                    )
                    break
        pp_item["product_attribute_value_ids"] = product_attribute_value_ids

    # FILTER ATTRIBUTE IDS
    # [[12,23], [232,23]]
    product_attribute_value_ids = list(
        map(lambda e: e["product_attribute_value_ids"], products)
    )
    # [12,23,232,23]
    product_attribute_value_ids = reduce(list.__add__, product_attribute_value_ids)
    # [12,23,232]
    product_attribute_value_ids = list(set(product_attribute_value_ids))

    # pav = product.attribute.value
    pav_table = "product.attribute.value"
    pav_filter = [[["id", "in", product_attribute_value_ids]]]
    pav_fields = ["display_name"]
    attribute_values = get_model(proxy, pav_table, pav_filter, pav_fields)

    # CREATE LIST LABEL DICT
    labels = []

    attribute = list(
        filter(
            lambda e: e["id"] in products[0]["product_attribute_value_ids"],
            attribute_values,
        )
    )
    labels.append(
        {
            "quantity": 1,  # DEFAULT QTY
            "code": products[0]["barcode"],
            "desc": products[0]["name"],
            "mCode": products[0]["default_code"],
            "cats": products[0]["categ_id"][1],
            "price": products[0]["lst_price"],
            "attr": list(map(lambda e: e["display_name"], attribute)),
        }
    )

    data = {
        "statusCode": 200,
        "allLabels": "ALL",
        "body": labels,
    }

    return JsonResponse(data)


def get_product_template(request, pt_id):
    proxy = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(settings.ODOO_URL))

    # pp = product.product
    pp_table = "product.product"
    pp_filter = [[["product_tmpl_id", "=", pt_id]]]
    pp_fields = [
        "barcode",
        "name",
        "description",
        "default_code",
        "categ_id",
        "lst_price",
        "product_template_attribute_value_ids",
        "product_tmpl_id",
    ]
    # GET PRODUCTS WITH FILTERED PRODUCT IDS
    products = get_model(proxy, pp_table, pp_filter, pp_fields)

    ptav_table = "product.template.attribute.value"
    ptav_filter = [[["product_tmpl_id", "=", pt_id]]]
    ptav_fields = ["product_attribute_value_id"]
    product_template_attribute_value_list = get_model(
        proxy, ptav_table, ptav_filter, ptav_fields
    )

    # FOR v15 WE NOW HAVE AN INTERMEDIARY MODEL 'product.template.attribute.value'
    for pp_item in products:
        product_attribute_value_ids = []
        for ptav_id in pp_item["product_template_attribute_value_ids"]:
            for ptav_item in product_template_attribute_value_list:
                if ptav_id == ptav_item["id"]:
                    product_attribute_value_ids.append(
                        ptav_item["product_attribute_value_id"][0]
                    )
                    break
        pp_item["product_attribute_value_ids"] = product_attribute_value_ids

    # FILTER ATTRIBUTE IDS
    # [[12,23], [232,23]]
    product_attribute_value_ids = list(
        map(lambda e: e["product_attribute_value_ids"], products)
    )
    # [12,23,232,23]
    product_attribute_value_ids = reduce(list.__add__, product_attribute_value_ids)
    # [12,23,232]
    product_attribute_value_ids = list(set(product_attribute_value_ids))

    # pav = product.attribute.value
    pav_table = "product.attribute.value"
    pav_filter = [[["id", "in", product_attribute_value_ids]]]
    pav_fields = ["display_name"]
    attribute_values = get_model(proxy, pav_table, pav_filter, pav_fields)

    # CREATE LIST LABEL DICT
    labels = []

    for product in products:
        pass
        attribute = list(
            filter(
                lambda e: e["id"] in product["product_attribute_value_ids"],
                attribute_values,
            )
        )
        labels.append(
            {
                "quantity": 1,  # DEFAULT QTY
                "code": product["barcode"],
                "desc": product["name"],
                "mCode": product["default_code"],
                "cats": product["categ_id"][1],
                "price": product["lst_price"],
                "attr": list(map(lambda e: e["display_name"], attribute)),
            }
        )

    data = {
        "statusCode": 200,
        "allLabels": "ALL",
        "body": labels,
    }

    return JsonResponse(data)


def get_purchase_order(request, po_id):
    proxy = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(settings.ODOO_URL))

    # pol = purchase.order.line
    pol_table = "purchase.order.line"
    pol_filter = [[["order_id", "=", po_id]]]
    pol_fields = ["product_id", "product_qty"]
    order_line = get_model(proxy, pol_table, pol_filter, pol_fields)

    if len(order_line) == 0:
        return {
            "statusCode": 400,
            "body": "po does not exists",
        }

    # FILTER PRODUCT IDS ONLY
    product_ids = list(map(lambda e: e["product_id"][0], order_line))

    # pp = product.product
    pp_table = "product.product"
    pp_filter = [[["id", "in", product_ids]]]
    pp_fields = [
        "barcode",
        "name",
        "description",
        "default_code",
        "categ_id",
        "lst_price",
        "product_template_attribute_value_ids",
        "product_tmpl_id",
    ]
    # GET PRODUCTS WITH FILTERED PRODUCT IDS
    products = get_model(proxy, pp_table, pp_filter, pp_fields)
    tmpl_id = products[0]["product_tmpl_id"][0]

    ptav_table = "product.template.attribute.value"
    ptav_filter = [[["product_tmpl_id", "=", tmpl_id]]]
    ptav_fields = ["product_attribute_value_id"]
    product_template_attribute_value_list = get_model(
        proxy, ptav_table, ptav_filter, ptav_fields
    )

    # FOR v15 WE NOW HAVE AN INTERMEDIARY MODEL 'product.template.attribute.value'
    for pp_item in products:
        product_attribute_value_ids = []
        for ptav_id in pp_item["product_template_attribute_value_ids"]:
            for ptav_item in product_template_attribute_value_list:
                if ptav_id == ptav_item["id"]:
                    product_attribute_value_ids.append(
                        ptav_item["product_attribute_value_id"][0]
                    )
                    break
        pp_item["product_attribute_value_ids"] = product_attribute_value_ids

    # FILTER ATTRIBUTE IDS
    # [[12,23], [232,23]]
    product_attribute_value_ids = list(
        map(lambda e: e["product_attribute_value_ids"], products)
    )
    # [12,23,232,23]
    product_attribute_value_ids = reduce(list.__add__, product_attribute_value_ids)
    # [12,23,232]
    product_attribute_value_ids = list(set(product_attribute_value_ids))

    # pav = product.attribute.value
    pav_table = "product.attribute.value"
    pav_filter = [[["id", "in", product_attribute_value_ids]]]
    pav_fields = ["display_name"]
    attribute_values = get_model(proxy, pav_table, pav_filter, pav_fields)

    # CREATE LIST LABEL DICT
    labels = []

    for i in range(0, len(order_line)):
        product_id = order_line[i]["product_id"][0]
        product = list(filter(lambda e: e["id"] == product_id, products))
        # LENGTH OF ORDER_LINE CAN DIFFER FROM PRODUCTS LENGTH
        # IF THAT'S THE CASE THERE ARE SOME ARCHIVED PRODUCTS
        if len(product) > 0:
            product = product[0]
        else:
            continue
        attribute = list(
            filter(
                lambda e: e["id"] in product["product_attribute_value_ids"],
                attribute_values,
            )
        )
        labels.append(
            {
                "quantity": order_line[i]["product_qty"],
                "code": product["barcode"],
                "desc": product["name"],
                "mCode": product["default_code"],
                "cats": product["categ_id"][1],
                "price": product["lst_price"],
                "attr": list(map(lambda e: e["display_name"], attribute)),
            }
        )

    data = {
        "statusCode": 200,
        "allLabels": "ALL" if len(order_line) == len(products) else "INCOMPLETE",
        "body": labels,
    }

    return JsonResponse(data)


def get_purchase_order_sheet(request, po_id):
    proxy = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(settings.ODOO_URL))

    # po = purchase.order
    po_table = "purchase.order"
    po_filter = [[["id", "=", po_id]]]
    po_fields = ["name", "date_order", "create_uid", "partner_ref", "partner_id"]

    order = get_model(proxy, po_table, po_filter, po_fields)

    # pol = purchase.order.line
    pol_table = "purchase.order.line"
    pol_filter = [[["order_id", "=", po_id]]]
    pol_fields = ["product_id", "product_qty", "date_planned"]
    order_line = get_model(proxy, pol_table, pol_filter, pol_fields)

    if len(order_line) == 0:
        return {
            "statusCode": 400,
            "body": "po does not exists",
        }

    # FILTER PRODUCT IDS ONLY
    product_ids = list(map(lambda e: e["product_id"][0], order_line))

    # pp = product.product
    pp_table = "product.product"
    pp_filter = [[["id", "in", product_ids]]]
    pp_fields = [
        "display_name",
        "categ_id",
        "product_tmpl_id",
    ]
    # GET PRODUCTS WITH FILTERED PRODUCT IDS
    products = get_model(proxy, pp_table, pp_filter, pp_fields)

    # CREATE ORDER_LINE LIST DICT
    order_lines = []

    for i in range(0, len(order_line)):
        product_id = order_line[i]["product_id"][0]
        product = list(filter(lambda e: e["id"] == product_id, products))
        # LENGTH OF ORDER_LINE CAN DIFFER FROM PRODUCTS LENGTH
        # IF THAT'S THE CASE THERE ARE SOME ARCHIVED PRODUCTS
        if len(product) > 0:
            product = product[0]
        else:
            continue

        order_lines.append(
            {
                "name": product["display_name"],
                "cats": product["categ_id"][1],
                "quantity": order_line[i]["product_qty"],
                "datetime": order_line[i]["date_planned"],
            }
        )

    date_obj = datetime.strptime(
        order[0]["date_order"], "%Y-%m-%d %H:%M:%S"
    ) - timedelta(hours=5)
    data = {
        "statusCode": 200,
        "allLabels": "ALL" if len(order_line) == len(products) else "INCOMPLETE",
        "order_details": {
            "username": f"{request.user.first_name} {request.user.last_name}",
            "datetime": datetime.strftime(date_obj, "%Y-%m-%d %H:%M:%S"),
            "name": order[0]["name"],
            "partner_name": order[0]["partner_id"][1],
            "partner_ref": order[0]["partner_ref"] if order[0]["partner_ref"] else "",
        },
        "order_lines": order_lines,
    }

    return JsonResponse(data)
