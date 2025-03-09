import datetime as dt
from enum import Enum
from .parser import product_client_result, transform_product_json
from .models import ProductStats, WeightMap, ProductCategory
from .utils import rpc
from django.conf import settings
import time
import xml.etree.ElementTree as ET

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
        self.taxes_id = [[6, False, [6]]]
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
        self.supplier_taxes_id = [[6, False, [4]]]
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
        self.pos_categ_ids = None
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
        self.pos_categ_ids = dict.get("pos_categ_ids", [])
        self.attribute_line_ids = []
        self.__set_attrs(dict["attribute_line_ids"])

    def clear_prod_vals(self):
        self.name = None
        self.default_code = None
        self.list_price = None
        self.categ_id = None
        self.pos_categ_ids = None
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


def edit_product_weight(weight, product_product_list, uid, proxy):
    ids = list(map(lambda product_product: product_product["id"], product_product_list))
    rpc.update_model("product.product", ids, {"weight": weight}, uid, proxy=proxy)


def update_weightmap(new_weight, category_id):
    try:
        weight_map = WeightMap.objects.get(product_category_id=category_id)
        if weight_map.weight != new_weight:
            weight_map.weight = new_weight
            weight_map.save()
    except WeightMap.DoesNotExist:
        WeightMap.objects.create(weight=new_weight, product_category_id=category_id)


def create_product_new(
    product_template,
    default_code_map,
    list_price_map,
    weight,
    client_id,
    uid,
    proxy,
    user,
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
    edit_product_weight(weight, product_product_list, uid, proxy)

    # SAVE PRODUCT ODOO ID AND REACT ID IN DB
    ProductStats.objects.create(odoo_id=tmpl_id, client_id=client_id, user_id=uid)

    # SAVE OR UPDATE WEIGHT IN DB
    update_weightmap(weight, product_template["categ_id"])

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
        tmpl_id = create_product_new(
            product_template.__dict__,
            transf["default_code_map"],
            transf["list_price_map"],
            transf["weight_map"],
            transf["client_id"],
            uid,
            proxy,
            user,
        )
        product_template.clear_prod_vals()
        product_tmpl_ids.append(tmpl_id)

    return product_tmpl_ids


def create_products_v2(raw_data, curr_user):
    transf_list = transform_product_json(raw_data)
    product_tmpl_ids = product_new(transf_list, int(settings.ODOO_UID), 0, curr_user)
    # Se genera el XML de exportación y se puede registrar o utilizar según convenga
    create_export_xml(product_tmpl_ids, int(settings.ODOO_UID), rpc.get_proxy())
    # Aquí se podría guardar o enviar xml_export si es necesario
    product_results = product_client_result(product_tmpl_ids)
    return product_results


def get_weight_list():
    return {"weight_list": list(WeightMap.objects.values())}

def create_export_xml(created_product_ids, uid, proxy):
    """
    Genera un archivo XML de exportación para los registros de product.template y product.product
    y registra el xml_id en ir.model.data.
    """
    root = ET.Element("odoo")

    for product_id in created_product_ids:
        timestamp = int(time.time())
        unique_xml_id_template = f"product_template_{product_id}_{timestamp}"
        
        # Registrar en ir.model.data
        rpc.create_model("ir.model.data", {
            "name": unique_xml_id_template,
            "module": "kdosh_module",
            "model": "product.template",
            "res_id": product_id,
            "noupdate": False
        }, uid, proxy=proxy)

        record_template = ET.SubElement(root, "record", {
            "id": unique_xml_id_template,
            "model": "product.template",
            "noupdate": "0"
        })
        record_template.set("res_id", str(product_id))

        variant_data = rpc.get_model(
            "product.product",
            [[["product_tmpl_id", "=", product_id]]],
            ["id"],
            proxy=proxy
        )

        if not variant_data:
            continue

        variant_ids = [record["id"] for record in variant_data]

        for variant_id in variant_ids:
            timestamp_variant = int(time.time())
            unique_xml_id_product = f"product_product_{variant_id}_{timestamp_variant}"

            rpc.create_model("ir.model.data", {
                "name": unique_xml_id_product,
                "module": "kdosh_module",
                "model": "product.product",
                "res_id": variant_id,
                "noupdate": False
            }, uid, proxy=proxy)

            record_variant = ET.SubElement(root, "record", {
                "id": unique_xml_id_product,
                "model": "product.product",
                "noupdate": "0"
            })
            record_variant.set("res_id", str(variant_id))

    xml_str = ET.tostring(root, encoding="utf-8", method="xml").decode("utf-8")

    try:
        with open("export.xml", "w", encoding="utf-8") as f:
            f.write(xml_str)
    except IOError as e:
        print(f"Error al escribir el archivo XML: {e}")

    return xml_str