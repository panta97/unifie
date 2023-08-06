import os
from django.conf import settings
from xmlrpc import client as xmlrpclib
from ..utils.utils import tuple_to_dictionary
from ..utils.sql import select
from ..models import (
    ProductCategory,
    PosCategory,
    ProductAttribute,
    ProductAttributeValue,
    ResPartner,
)

# from models import


def update_product_catalogs():
    url = settings.ODOO_URL
    db = settings.ODOO_DB
    password = settings.ODOO_PWD
    uid = int(settings.ODOO_UID)
    models = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(url))

    # PRODUCT CATEGORY
    cat_list = models.execute_kw(
        db,
        uid,
        password,
        "product.category",
        "search_read",
        [[]],
        {
            "fields": ["id", "parent_id", "name", "display_name"],
            "context": {"lang": "es_PE"},
        },
    )

    # POS CATEGORY
    cat_pos_list = models.execute_kw(
        db,
        uid,
        password,
        "pos.category",
        "search_read",
        [[]],
        {
            "fields": ["id", "parent_id", "name", "display_name"],
            "context": {"lang": "es_PE"},
        },
    )

    # PRODUCT ATTRIBUTE
    attr_list = models.execute_kw(
        db,
        uid,
        password,
        "product.attribute",
        "search_read",
        [[]],
        {"fields": ["id", "name"], "context": {"lang": "es_PE"}},
    )

    # PRODUCT ATTRIBUTE VALUE
    attr_line_list = models.execute_kw(
        db,
        uid,
        password,
        "product.attribute.value",
        "search_read",
        [[]],
        {
            "fields": ["id", "attribute_id", "display_name", "name"],
            "context": {"lang": "es_PE"},
        },
    )

    # each comes in this form
    # cat {'id': 1491, 'parent_id': [31, 'ACCESORIO'], 'name': 'ARETES', 'display_name': 'ACCESORIO / ARETES'}
    # cat_pos {'id': 2, 'parent_id': False, 'name': 'ACCESORIO CABALLERO', 'display_name': 'ACCESORIO CABALLERO'}
    # attr {'id': 23, 'name': 'TALLAS BRASIERE'}
    # attr_line {'id': 2354, 'attribute_id': [45, 'COLORES MANUFACTURA SI'], 'name': 'FROST STONE', 'display_name': 'COLORES MANUFACTURA SI: FROST STONE'}

    cat_objs = []
    for item in cat_list:
        cat_objs.append(
            ProductCategory(
                id=item["id"],
                parent_id=0
                if type(item["parent_id"]) == bool
                else item["parent_id"][0],
                name=item["name"],
                display_name=item["display_name"],
            )
        )
    # because of this we cannot have an explicit foreign key for weightMap table
    ProductCategory.objects.all().delete()
    ProductCategory.objects.bulk_create(cat_objs)

    cat_pos_objs = []
    for item in cat_pos_list:
        cat_pos_objs.append(
            PosCategory(
                id=item["id"],
                parent_id=0
                if type(item["parent_id"]) == bool
                else item["parent_id"][0],
                name=item["name"],
                display_name=item["display_name"],
            )
        )
    PosCategory.objects.all().delete()
    PosCategory.objects.bulk_create(cat_pos_objs)

    attr_objs = []
    for item in attr_list:
        attr_objs.append(ProductAttribute(id=item["id"], name=item["name"]))
    ProductAttribute.objects.all().delete()
    ProductAttribute.objects.bulk_create(attr_objs)

    attr_line_objs = []
    for item in attr_line_list:
        attr_line_objs.append(
            ProductAttributeValue(
                id=item["id"],
                attribute_id=item["attribute_id"][0],
                name=item["name"],
                attribute_name=item["attribute_id"][1],
            )
        )
    ProductAttributeValue.objects.all().delete()
    ProductAttributeValue.objects.bulk_create(attr_line_objs)


def get_product_catalogs():
    catalogs = {}
    # ------------ GET PRODUCT_CATEGORY ------------
    query_product_category = """
        with recursive category (level, id, parent_id, name) as (
            select 1, pc.id, pc.parent_id, pc."name"
            from rpc_product_category pc
            where pc.parent_id = 0
                and id not in (1, 3, 5816, 6784)
                -- filter All, INSUMOS, DESCUENTO, OLYMPO
            union all
            select c.level + 1, pc2.id, pc2.parent_id, pc2."name"
            from rpc_product_category pc2
                    inner join category c
                                on c.id = pc2.parent_id
        )
        select level, id, parent_id, name from category
        order by name;
    """

    product_category = select(query_product_category)
    cat_mapper = [
        {"field": "id", "i": 1},
        {"field": "parent_id", "i": 2},
        {"field": "name", "i": 3},
    ]
    catalogs["product_category_line"] = [
        tuple_to_dictionary(cat, cat_mapper) for cat in product_category if cat[0] == 1
    ]
    catalogs["product_category_family"] = [
        tuple_to_dictionary(cat, cat_mapper) for cat in product_category if cat[0] == 2
    ]
    catalogs["product_category_brand"] = [
        tuple_to_dictionary(cat, cat_mapper) for cat in product_category if cat[0] == 3
    ]

    # ------------ GET POS_CATEGORY ------------
    query_pos_category = """
        with recursive category (level, id, parent_id, name) as (
            select 1, pc.id, pc.parent_id, pc."name"
            from rpc_pos_category pc
            where pc.parent_id = 0
                and id not in (40)
                -- filter OLYMPO
            union all
            select c.level + 1, pc2.id, pc2.parent_id, pc2."name"
            from rpc_pos_category pc2
                    inner join category c
                                on c.id = pc2.parent_id
        )
        select id, name from category
        where level = 1
        order by name;
    """
    pos_category = select(query_pos_category)
    pos_mapper = [
        {"field": "id", "i": 0},
        {"field": "name", "i": 1},
    ]
    catalogs["pos_category"] = [
        tuple_to_dictionary(pos, pos_mapper) for pos in pos_category
    ]

    # ------------ GET ATTRIBUTE ------------
    query_attribute = """
        select id, name
        from rpc_product_attribute
        order by name;
    """
    attribute = select(query_attribute)
    attribute_mapper = [
        {"field": "id", "i": 0},
        {"field": "name", "i": 1},
    ]
    catalogs["product_attribute"] = [
        tuple_to_dictionary(attr, attribute_mapper) for attr in attribute
    ]

    # ------------ GET ATTRIBUTE VALUE ------------
    query_attribute_val = """
        select id, attribute_id, name
        from rpc_product_attribute_value
        -- filter ".30"
        where id <> 1646
        order by name;
    """
    attribute_val = select(query_attribute_val)
    attribute_val_mapper = [
        {"field": "id", "i": 0},
        {"field": "attribute_id", "i": 1},
        {"field": "name", "i": 2},
    ]
    catalogs["product_attribute_value"] = [
        tuple_to_dictionary(attr_val, attribute_val_mapper)
        for attr_val in attribute_val
    ]

    return catalogs


def update_order_catalogs():
    url = settings.ODOO_URL
    db = settings.ODOO_DB
    password = settings.ODOO_PWD
    uid = int(settings.ODOO_UID)
    models = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(url))

    # RES PARTNER
    res_partner_list = models.execute_kw(
        db,
        uid,
        password,
        "res.partner",
        "search_read",
        [[["supplier_rank", ">", 0]]],
        {"fields": ["id", "name", "vat"], "context": {"lang": "es_PE"}},
    )

    res_partner_objs = []
    for item in res_partner_list:
        res_partner_objs.append(
            ResPartner(id=item["id"], name=item["name"], vat=item["vat"])
        )

    ResPartner.objects.all().delete()
    ResPartner.objects.bulk_create(res_partner_objs)


def get_order_catalogs():
    catalogs = {}

    query_res_partner = """
        select id, name, vat
        from rpc_res_partner
    """
    res_partner = select(query_res_partner)
    partner_mapper = [
        {"field": "id", "i": 0},
        {"field": "name", "i": 1},
        {"field": "vat", "i": 2},
    ]
    catalogs["res_partner"] = [
        tuple_to_dictionary(partner, partner_mapper) for partner in res_partner
    ]

    return catalogs
