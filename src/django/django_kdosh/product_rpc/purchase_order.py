# import core.db.sqlite.purchase_order as po
import datetime as dt

from xmlrpc import client as xmlrpclib
from datetime import datetime
from django.conf import settings
from .utils import utils, rpc, sql
from .models import OrderStats


def search_product_by_name(name):
    pp_table = "product.product"
    kwards = {
        "name": name,
        "args": [["purchase_ok", "=", True]],
        "operator": "ilike",
        "limit": 13,
        "context": {"lang": "es_PE", "tz": "America/Lima", "uid": 1, "company_id": 1},
    }
    # TODO: refactor to rpc file
    modelrpc = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(settings.ODOO_URL))
    result = modelrpc.execute_kw(
        settings.ODOO_DB,
        int(settings.ODOO_UID),
        settings.ODOO_PWD,
        pp_table,
        "name_search",
        [],
        kwards,
    )

    products = []
    for prod in result:
        products.append(
            {
                "id": prod[0],
                "name": prod[1],
            }
        )
    return products


def get_attrs(attr_val_ids):
    if len(attr_val_ids) == 0:
        return []
    raw_sql = """
    with attribute_sorted as
    (
        select
        id,
        name,
        case
            when name like '%TALLA%' then 1
            else 2
        end as attr_order
        from rpc_product_attribute
    )
    ,attribute_value_sorted as
    (
        select
            pav.id id,
            case
                when pavo.sort is null then pav.id
                else pavo.sort
            end as sort
        from rpc_product_attribute_value pav
        left join rpc_product_attribute_value_order pavo
            on pav.id = pavo.attr_val_id
    )
    select
        pav.id attr_val_id,
        ats.id attribute_id,
        pav.name attr_val_name,
        ats.name attribute_name
    from rpc_product_attribute_value pav
    left join attribute_sorted ats
        on pav.attribute_id = ats.id
    left join attribute_value_sorted atvs
        on pav.id  = atvs.id
    where pav.id in ({})
    order by atvs.sort;
    """.format(
        ",".join(map(str, attr_val_ids))
    )
    res = sql.select(raw_sql)
    return res


def get_order_item(product_id, type):
    product_id = int(product_id)
    # get product template id
    product_tmpl_id = 0
    product_tmpl_name = ""

    proxy = rpc.get_proxy()

    if type == "product_product":
        product_template = rpc.get_model(
            "product.product",
            [[["id", "=", product_id]]],
            ["product_tmpl_id"],
            proxy=proxy,
        )
        if len(product_template) == 0:
            raise Exception("producto no existe")
        product_tmpl_id = product_template[0]["product_tmpl_id"][0]
        product_tmpl_name = product_template[0]["product_tmpl_id"][1]
    elif type == "product_template":
        product_template = rpc.get_model(
            "product.template", [[["id", "=", product_id]]], ["name"], proxy=proxy
        )
        if len(product_template) == 0:
            raise Exception("producto no existe")
        product_tmpl_id = product_template[0]["id"]
        product_tmpl_name = product_template[0]["name"]

    # pp = product.product
    pp_table = "product.product"
    pp_filter = [[["product_tmpl_id", "=", product_tmpl_id]]]
    pp_fields = [
        "product_template_attribute_value_ids",
        "display_name",
    ]

    # ----------------- CREATE ATTRS OBJECT -----------------
    # GET PRODUCTS WITH FILTERED PRODUCT IDS
    product_product = rpc.get_model(pp_table, pp_filter, pp_fields, proxy=proxy)
    product_template_attribute_value_list = rpc.get_model(
        "product.template.attribute.value",
        [[["product_tmpl_id", "=", product_tmpl_id]]],
        ["product_attribute_value_id"],
        proxy=proxy,
    )

    # FOR v15 WE NOW HAVE AN INTERMEDIARY MODEL 'product.template.attribute.value'
    for pp_item in product_product:
        product_attribute_value_ids = []
        for ptav_id in pp_item["product_template_attribute_value_ids"]:
            for ptav_item in product_template_attribute_value_list:
                if ptav_id == ptav_item["id"]:
                    product_attribute_value_ids.append(
                        ptav_item["product_attribute_value_id"][0]
                    )
                    break
        pp_item["product_attribute_value_ids"] = product_attribute_value_ids

    attr_val_ids = []
    for product in product_product:
        attr_val_ids.extend(product["product_attribute_value_ids"])
    distinct_attr_val_ids = list(set(attr_val_ids))

    db_attrs = get_attrs(distinct_attr_val_ids)

    attribute_mapper = [
        {"field": "attr_val_id", "i": 0},
        {"field": "attribute_id", "i": 1},
        {"field": "attr_val_name", "i": 2},
        {"field": "attribute_name", "i": 3},
    ]
    attributes = [
        utils.tuple_to_dictionary(db_attr, attribute_mapper) for db_attr in db_attrs
    ]

    attrs_dic = {}
    for attribute in attributes:
        if attribute["attribute_id"] in attrs_dic:
            attrs_dic[attribute["attribute_id"]]["attr_vals"].append(
                {"id": attribute["attr_val_id"], "name": attribute["attr_val_name"]}
            )
        else:
            attrs_dic[attribute["attribute_id"]] = {
                "attr": {
                    "id": attribute["attribute_id"],
                    "name": attribute["attribute_name"],
                },
                "attr_vals": [
                    {"id": attribute["attr_val_id"], "name": attribute["attr_val_name"]}
                ],
            }
    attrs = list(attrs_dic.values())
    # RETURN OBJECT
    order_item = {
        "odoo_link": "{}/web#id={}&cids=1&menu_id=206&action=354&model=product.template&view_type=form".format(
            settings.ODOO_URL, product_tmpl_id
        ),
        "is_in_list": False,
        "id": utils.get_epoch_time(),
        "name": product_tmpl_name,
        "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    }
    # ----------------- CREATE PRODUCT MATRIX OBJECT -----------------
    product_matrix = []
    if len(attrs) == 0:
        # raise Exception("producto no tiene atributos")
        product_items = [
            {
                "id": product_product[0]["id"],
                "name": product_product[0]["display_name"],
                "attrs": [],
                "qty": 0,
                "price": 0,
            }
        ]
        product_row = {
            "id": 1,
            "product_items": product_items,
        }
        product_matrix.append(product_row)
        order_item["product_matrix"] = product_matrix
    # rearrange products based on attrs
    elif len(attrs) == 1:
        attr_cols = attrs[0]["attr_vals"]
        product_items = []
        for attr_col in attr_cols:
            for product in product_product:
                if set([attr_col["id"]]).issubset(
                    set(product["product_attribute_value_ids"])
                ):
                    product_items.append(
                        {
                            "id": product["id"],
                            "name": product["display_name"],
                            "attrs": product["product_attribute_value_ids"],
                            "qty": 0,
                            "price": 0,
                        }
                    )
        product_row = {
            "id": attr_col["id"],
            "product_items": product_items,
        }
        product_matrix.append(product_row)
        order_item["attr_cols"] = attrs[0]
        order_item["product_matrix"] = product_matrix
    elif len(attrs) == 2:
        attr_cols = attrs[0]["attr_vals"]  # TALLA ATTR AS COLS
        attr_rows = attrs[1]["attr_vals"]
        for attr_row in attr_rows:
            product_items = []
            for attr_col in attr_cols:
                for product in product_product:
                    attr_cell = [attr_row["id"], attr_col["id"]]
                    if set(attr_cell).issubset(
                        set(product["product_attribute_value_ids"])
                    ):
                        product_items.append(
                            {
                                "id": product["id"],
                                "name": product["display_name"],
                                "attrs": product["product_attribute_value_ids"],
                                "qty": 0,
                                "price": 0,
                            }
                        )
            product_row = {
                "id": attr_row["id"],
                "product_items": product_items,
            }
            product_matrix.append(product_row)
        order_item["attr_rows"] = attrs[1]
        order_item["attr_cols"] = attrs[0]
        order_item["product_matrix"] = product_matrix
    else:
        raise Exception("producto tiene más de 2 atributos")

    return order_item


# create_order


class Order:
    def __init__(self):
        self.priority = "0"
        self.partner_id = None
        self.partner_ref = None
        self.currency_id = 154
        self.date_order = None
        self.date_planned = None
        self.receipt_reminder_email = False
        self.reminder_date_before_receipt = 1
        self.picking_type_id = 1
        self.dest_address_id = False
        self.order_line = []
        self.notes = "<p><br></p>"
        self.user_id = None
        self.company_id = 1
        self.origin = False
        self.incoterm_id = False
        self.payment_term_id = False
        self.fiscal_position_id = 1
        self.message_follower_ids = []
        self.activity_ids = []
        self.message_ids = []

    def __set_lines(self, order_lines):
        virtual_count = 1110
        for line in order_lines:
            virtual = "virtual_{}".format(virtual_count)
            self.order_line.append(
                [
                    0,
                    virtual,
                    {
                        "display_type": False,
                        "sequence": 10,
                        "product_id": line["product_id"],
                        "name": line["name"],
                        "date_planned": line["date_planned"],
                        "move_dest_ids": [],
                        "account_analytic_id": False,
                        "analytic_tag_ids": [[6, False, []]],
                        "product_qty": line["product_qty"],
                        "qty_received_manual": 0,
                        "product_uom": 1,
                        "product_packaging_qty": 0,
                        "product_packaging_id": False,
                        "price_unit": line["price_unit"],
                        "taxes_id": [[6, False, [line["tax_id"]]]],
                        "move_ids": [[5, 0, 0]],
                        "propagate_cancel": True,
                    },
                ]
            )
            virtual_count += 10

    def set_order_dict(self, dict, uid):
        self.user_id = uid
        self.date_order = dict["date_order"]
        self.partner_id = dict["partner_id"]
        self.partner_ref = dict["partner_ref"]
        # self.amount_tax_otros = dict['amount_tax_otros']
        self.date_planned = dict["date_order"]
        self.__set_lines(dict["order_lines"])


def create_order(order, user):
    url = settings.ODOO_URL
    db = settings.ODOO_DB
    uid = int(settings.ODOO_UID)
    password = utils.get_user_password(uid)
    models = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(url))
    order_template = Order()
    order_template.set_order_dict(order, uid)
    kwargs = {
        "context": {
            "lang": "es_PE",
            "tz": "America/Lima",
            "uid": uid,
            "allowed_company_ids": [1],
            "params": {
                "menu_id": 260,
                "cids": 1,
                "action": 401,
                "model": "purchase.order",
                "view_type": "form",
            },
            "quotation_only": True,
        }
    }

    order_id = models.execute_kw(
        db, uid, password, "purchase.order", "create", [order_template.__dict__], kwargs
    )
    # CREATE COMMENT
    comment_obj = {
        "body": f"Creado por: {user.first_name} {user.last_name}",
        "model": "purchase.order",
        "res_id": order_id,
        "message_type": "comment",
    }
    comment_id = rpc.create_model("mail.message", comment_obj, uid, proxy=models)
    # SAVE ORDER ODOO ID INTO DB
    OrderStats.objects.create(odoo_id=order_id, user_id=uid)

    return order_id
