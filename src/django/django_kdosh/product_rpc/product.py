import datetime as dt
from enum import Enum

from .parser import product_client_result, transform_product_json
from .models import ProductStats
from .utils import rpc
from django.conf import settings
import json


class ProductResult(Enum):
    ALL = 1
    INCOMPLETE = 2
    NONE = 3


class Product:
    def __init__(self):
        self.type = "product"
        self.image_1920 = False
        # self.__last_update =  False
        self.priority = "0"
        self.sale_ok = True
        self.purchase_ok = True
        self.active = True
        self.detailed_type = "product"
        self.uom_id = 1
        self.uom_po_id = 1
        self.taxes_id = [[6, False, [2]]]
        self.l10n_pe_withhold_code = False
        self.l10n_pe_withhold_percentage = 0
        self.standard_price = 0
        self.barcode = False
        self.company_id = False
        self.description = "<p><br></p>"
        self.available_in_pos = True
        self.to_weight = False
        self.description_sale = False
        self.seller_ids = []
        self.supplier_taxes_id = [[6, False, [6]]]
        self.purchase_method = "receive"
        self.description_purchase = False
        self.purchase_line_warn = "no-message"
        self.route_ids = [[6, False, [5]]]
        self.weight = 0
        self.volume = 0
        self.sale_delay = 0
        self.tracking = "none"
        self.property_stock_production = 15
        self.property_stock_inventory = 14
        self.packaging_ids = []
        self.description_pickingin = False
        self.description_pickingout = False
        self.description_picking = False
        self.property_account_income_id = False
        self.property_account_expense_id = 809
        self.property_account_creditor_price_difference = False
        self.unspsc_code_id = False
        self.message_follower_ids = []
        self.activity_ids = []
        self.message_ids = []

        # UNIQUE PROPERTIES

        self.responsible_id = None
        self.name = None
        self.default_code = None
        self.list_price = None
        self.categ_id = None
        self.pos_categ_id = None
        self.attribute_line_ids = []

    def __set_attrs(self, attr_lines):
        virtual_count = 1110  ## just because

        for attr in attr_lines:
            virtual = "virtual_{}".format(virtual_count)
            self.attribute_line_ids.append(
                [
                    0,
                    virtual,
                    {
                        "attribute_id": attr["attribute_id"],
                        "value_ids": [[6, False, attr["value_ids"]]],
                    },
                ]
            )
            virtual_count += 10

    def set_responsible_id(self, id):
        self.responsible_id = id

    def set_product_dict(self, dict):
        self.name = dict["name"]
        self.default_code = dict["default_code"]
        self.list_price = dict["list_price"]
        self.categ_id = dict["categ_id"]
        self.pos_categ_id = dict["pos_categ_id"]
        self.attribute_line_ids = []
        self.__set_attrs(dict["attribute_line_ids"])

    def clear_prod_vals(self):
        self.name = None
        self.default_code = None
        self.list_price = None
        self.categ_id = None
        self.pos_categ_id = None
        self.attribute_line_ids = []


def edit_product_default_code(
    df_map, product_product_list, product_template, uid, proxy
):
    # SINGLE DEFAULT CODE FOR ALL
    if len(df_map) == 0 and product_template["default_code"] != "":
        rpc.update_model(
            "product.product",
            [product_product["id"] for product_product in product_product_list],
            {"default_code": product_template["default_code"]},
            uid,
            proxy=proxy,
        )

    # MULTIPLE DEFAULT CODES
    if len(df_map) > 0:
        default_code_by_prod_ids = {}
        for product_product in product_product_list:
            for df_map_item in df_map:
                if set(df_map_item["ids"]).issubset(
                    set(product_product["product_attribute_value_ids"])
                ):
                    # default_code_by_prod_ids
                    if df_map_item["default_code"] in default_code_by_prod_ids:
                        default_code_by_prod_ids[df_map_item["default_code"]].append(
                            product_product["id"]
                        )
                    else:
                        default_code_by_prod_ids[df_map_item["default_code"]] = [
                            product_product["id"]
                        ]
                    break
        for default_code, ids in default_code_by_prod_ids.items():
            rpc.update_model(
                "product.product", ids, {"default_code": default_code}, uid, proxy=proxy
            )


def edit_product_list_price(lp_map, tmpl_id, uid, proxy):
    if len(lp_map) > 0:
        rpc.update_model(
            "product.template", [tmpl_id], {"list_price": 0}, uid, proxy=proxy
        )

        context = {
            "active_model": "product.template",
            "default_product_tmpl_id": tmpl_id,
            "active_id": tmpl_id,
            "uid": uid,
            "search_disable_custom_filters": True,
        }

        # MULTIPLE LIST PRICES
        list_price_by_prod_ids = {}
        for lp_map_item in lp_map:
            if lp_map_item["list_price"] in list_price_by_prod_ids:
                list_price_by_prod_ids[lp_map_item["list_price"]].append(
                    lp_map_item["ids"][0]
                )
            else:
                list_price_by_prod_ids[lp_map_item["list_price"]] = [
                    lp_map_item["ids"][0]
                ]
        for list_price, ids in list_price_by_prod_ids.items():
            rpc.update_model(
                "product.template.attribute.value",
                ids,
                {"price_extra": list_price},
                uid,
                context=context,
                proxy=proxy,
            )


def create_product_new(
    product_template, default_code_map, list_price_map, client_id, uid, proxy, user
):
    # CREATE PRODUCT
    tmpl_id = rpc.create_model("product.template", product_template, uid, proxy=proxy)
    # CREATE COMMENT
    comment_obj = {
        "body": f"Creado por: {user.first_name} {user.last_name}",
        "model": "product.template",
        "res_id": tmpl_id,
        "message_type": "comment",
    }
    comment_id = rpc.create_model("mail.message", comment_obj, uid, proxy=proxy)
    # GET PRODUCT.PRODUCT IDS
    product_template_attribute_value_list = rpc.get_model(
        "product.template.attribute.value",
        [[["product_tmpl_id", "=", tmpl_id]]],
        ["product_attribute_value_id"],
        proxy=proxy,
    )

    product_product_list = rpc.get_model(
        "product.product",
        [[["product_tmpl_id", "=", tmpl_id]]],
        ["product_template_attribute_value_ids"],
        proxy=proxy,
    )

    # FOR v15 WE NOW HAVE AN INTERMEDIARY MODEL 'product.template.attribute.value'
    for pp_item in product_product_list:
        product_attribute_value_ids = []
        for ptav_id in pp_item["product_template_attribute_value_ids"]:
            for ptav_item in product_template_attribute_value_list:
                if ptav_id == ptav_item["id"]:
                    product_attribute_value_ids.append(
                        ptav_item["product_attribute_value_id"][0]
                    )
                    break
        pp_item["product_attribute_value_ids"] = product_attribute_value_ids

    for lp_item in list_price_map:
        for ptav_item in product_template_attribute_value_list:
            if lp_item["ids"][0] == ptav_item["product_attribute_value_id"][0]:
                lp_item["ids"][0] = ptav_item["id"]
                break

    edit_product_default_code(
        default_code_map, product_product_list, product_template, uid, proxy
    )
    edit_product_list_price(list_price_map, tmpl_id, uid, proxy)

    # SAVE PRODUCT ODOO ID AND REACT ID INTO DB
    ProductStats.objects.create(odoo_id=tmpl_id, client_id=client_id, user_id=uid)

    return tmpl_id


def product_new(transf_list, uid, pid, user):
    product_template = None
    product_tmpl_ids = []
    for transf in transf_list:
        if product_template is None:
            product_template = Product()
            product_template.set_responsible_id(uid)

        proxy = rpc.get_proxy()
        product_template.set_product_dict(transf["product"])
        # return product_template.__dict__
        tmpl_id = create_product_new(
            product_template.__dict__,
            transf["default_code_map"],
            transf["list_price_map"],
            transf["client_id"],
            uid,
            proxy,
            user,
        )
        product_template.clear_prod_vals()
        product_tmpl_ids.append(tmpl_id)

    return product_tmpl_ids


def generate_barcode_product(product_tmpl_id,curr_user):
    json_model = """ {
        "id": 321,
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [
                [
                    578157
                ]
            ],
            "model": "product.template",
            "method": "action_generate_barcode",
            "kwargs": {
                "context": {
                    "lang": "es_PE",
                    "tz": "America/Lima",
                    "uid": 2,
                    "allowed_company_ids": [
                        1
                    ],
                    "params": {
                        "menu_id": 236,
                        "cids": 1,
                        "action": 374,
                        "model": "product.template",
                        "view_type": "form",
                        "id": 82952
                    },
                    "search_default_filter_to_availabe_pos": 1,
                    "default_available_in_pos": true,
                    "create_variant_never": "no_variant"
                }
            }
        }
    }
    """
    dict_model = json.loads(json_model)
    dict_model["params"]["args"][0][0] = product_tmpl_id
    dict_model["id"] = product_tmpl_id
    proxy = rpc.get_proxy()
    stock_picking_line_result = rpc.execute_json_model(dict_model, int(settings.ODOO_UID), proxy=proxy)
    return stock_picking_line_result


def create_products_v2(raw_data, curr_user):
    transf_list = transform_product_json(raw_data)
    product_tmpl_ids = product_new(transf_list, int(settings.ODOO_UID), 0, curr_user)
    if len(raw_data[0]["attrs"]) > 0 :
        generate_barcode_product(product_tmpl_ids,curr_user)
    product_results = product_client_result(product_tmpl_ids)
    return product_results
