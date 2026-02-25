# import core.db.sqlite.purchase_order as po
import datetime as dt

from xmlrpc import client as xmlrpclib
from datetime import datetime
from django.conf import settings
from .utils import utils, rpc, sql
from .models import OrderStats


WAREHOUSE_PICKING_TYPE = {
    1: 1,
    2: 7,
    3: 13,
    4: 33,
}

EMPRESA = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
}

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
    def __init__(self, company_id):
        self.company_id      = company_id
        self.picking_type_id = WAREHOUSE_PICKING_TYPE[company_id]
        self.currency_id = 157
        self.date_order = None
        self.date_planned = None
        self.dest_address_id = False
        self.fiscal_position_id = 1
        self.incoterm_id = False
        self.notes = "<p><br></p>"
        self.order_line = []
        self.origin = False
        self.partner_id = None
        self.partner_ref = None
        self.payment_term_id = False
        self.priority = "0"
        self.user_id = None
        self.receipt_reminder_email = False
        self.reminder_date_before_receipt = 1
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
                        # "account_analytic_id": False,
                        # "analytic_tag_ids": [[6, False, []]],
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
        self.company_id = dict.get("company_id", self.company_id)
        self.picking_type_id = WAREHOUSE_PICKING_TYPE[self.company_id]
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
    order_template = Order(company_id=order.get("company_id", 1))
    order_template.set_order_dict(order, uid)
    kwargs = {
        "context": {
            "lang": "es_PE",
            "tz": "America/Lima",
            "uid": uid,
            "allowed_company_ids": [order_template.company_id],
            "params": {
                "menu_id": 260,
                "cids": [order_template.company_id],
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
# ==================== ORDER EDITING FUNCTIONS ====================


def search_purchase_order_by_name(order_name):
    """
    Busca una orden de compra específica por su nombre en Odoo.

    Args:
        order_name (str): Nombre de la orden (ej: "P03788")

    Returns:
        dict: Información de la orden encontrada o None
    """
    proxy = rpc.get_proxy()
    po_table = "purchase.order"

    # Buscar por nombre exacto o similar (case insensitive)
    po_filter = [["|", ("name", "=", order_name), ("name", "ilike", order_name)]]

    po_fields = [
        "name",
        "partner_id",
        "partner_ref",
        "date_order",
        "amount_total",
        "state",
        "company_id",
    ]

    # Usar execute_kw directamente para poder usar limit
    orders = proxy.execute_kw(
        settings.ODOO_DB,
        int(settings.ODOO_UID),
        settings.ODOO_PWD,
        po_table,
        'search_read',
        po_filter,
        {'fields': po_fields, 'limit': 1, 'context': {'lang': 'es_PE'}}
    )
    orders = proxy.execute_kw(
        settings.ODOO_DB,
        int(settings.ODOO_UID),
        settings.ODOO_PWD,
        po_table,
        "search_read",
        po_filter,
        {"fields": po_fields, "limit": 1, "context": {"lang": "es_PE"}}
    )

    if not orders:
        return None

    order = orders[0]
    return {
        "id": order["id"],
        "name": order["name"],
        "partner_name": order["partner_id"][1] if order["partner_id"] else "",
        "partner_ref": order["partner_ref"] if order["partner_ref"] else "",
        "date_order": order["date_order"],
        "amount_total": order["amount_total"],
        "state": order["state"],
        "company_id": order["company_id"][0] if order["company_id"] else 1,
    }


def get_purchase_order_for_edit(po_id):
    """
    Obtiene una orden de compra existente de Odoo en formato compatible con el frontend.

    Args:
        po_id (int): ID de la orden de compra en Odoo

    Returns:
        dict: Orden de compra con estructura de OrderItem para el frontend

    Raises:
        Exception: Si la orden no existe o no puede editarse
    """
    proxy = rpc.get_proxy()

    # 1. Obtener datos de la orden
    po_table = "purchase.order"
    po_filter = [[["id", "=", po_id]]]
    po_fields = [
        "name",
        "partner_id",
        "partner_ref",
        "date_order",
        "state",
        "company_id",
        "picking_type_id",
        "incoming_picking_count",
    ]

    orders = rpc.get_model(po_table, po_filter, po_fields, proxy=proxy)

    if len(orders) == 0:
        raise Exception(f"Orden de compra {po_id} no existe")

    order = orders[0]

    # Validar que la orden puede editarse (solo draft o sent)
    if order["state"] not in ["draft", "sent"]:
        raise Exception(
            f"No se puede editar la orden en estado '{order['state']}'. "
            f"Solo se pueden editar órdenes en estado 'draft' o 'sent'."
        )

    # 2. Obtener líneas de la orden
    pol_table = "purchase.order.line"
    pol_filter = [[["order_id", "=", po_id]]]
    pol_fields = [
        "product_id",
        "name",
        "product_qty",
        "price_unit",
        "taxes_id",
        "date_planned",
    ]

    order_lines = rpc.get_model(pol_table, pol_filter, pol_fields, proxy=proxy)

    if len(order_lines) == 0:
        raise Exception(f"La orden {po_id} no tiene líneas de productos")

    # 3. Obtener detalles de productos
    product_ids = [line["product_id"][0] for line in order_lines]

    pp_table = "product.product"
    pp_filter = [[["id", "in", product_ids]]]
    pp_fields = [
        "display_name",
        "product_tmpl_id",
        "product_template_attribute_value_ids",
    ]

    products = rpc.get_model(pp_table, pp_filter, pp_fields, proxy=proxy)

    # 4. Crear un order_item simple por cada línea
    order_items = []
    base_id = utils.get_epoch_time()

    for idx, line in enumerate(order_lines):
        product_id = line["product_id"][0]
        product = next((p for p in products if p["id"] == product_id), None)

        if not product:
            continue

        tmpl_id = product["product_tmpl_id"][0]
        tmpl_name = product["product_tmpl_id"][1]

        # Crear order_item simple con solo esta variante específica
        simple_order_item = {
            "odoo_link": f"{settings.ODOO_URL}/web#id={tmpl_id}&cids=1&menu_id=206&action=354&model=product.template&view_type=form",
            "is_in_list": False,
            "id": base_id + idx,
            "name": tmpl_name,
            "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "product_matrix": [
                {
                    "id": 1,
                    "product_items": [
                        {
                            "id": product_id,
                            "name": product["display_name"],
                            "attrs": [],
                            "qty": line["product_qty"],
                            "price": line["price_unit"],
                        }
                    ],
                }
            ],
        }
        order_items.append(simple_order_item)

    # 5. Construir respuesta
    result = {
        "order_details": {
            "po_id": order["id"],
            "name": order["name"],
            "partner_id": order["partner_id"][0] if order["partner_id"] else None,
            "partner_ref": order["partner_ref"] if order["partner_ref"] else "",
            "date_order": order["date_order"],
            "state": order["state"],
            "company_id": order["company_id"][0] if order["company_id"] else 1,
            "tax": True,  # Asumir que tiene IGV por defecto
            "incoming_picking_count": order.get("incoming_picking_count", 0),
        },
        "order_items": order_items,
    }

    return result


def update_purchase_order(po_id, order_data, user):
    """
    Actualiza una orden de compra existente en Odoo.
    """
    try:
        url = settings.ODOO_URL
        db = settings.ODOO_DB
        uid = int(settings.ODOO_UID)
        password = utils.get_user_password(uid)
        models = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(url))
        
        # 1. Verificar orden
        orders = models.execute_kw(
            db, uid, password, 
            "purchase.order", "search_read", 
            [[["id", "=", po_id]]], 
            {'fields': ["state", "order_line"]}
        )
        
        if not orders:
            raise Exception(f"Orden {po_id} no encontrada")
            
        order = orders[0]
        
        if order["state"] not in ["draft", "sent"]:
            raise Exception(f"Estado inválido: {order['state']}")
        
        # 2. Construir líneas nuevas usando la clase Order
        order_template = Order(company_id=order_data.get("company_id", 1))
        order_template.set_order_dict(order_data, uid)
        
        # 3. Eliminar líneas viejas
        delete_commands = [[2, line_id, 0] for line_id in order["order_line"]]
        
        # 4. Ajustar formato de líneas nuevas para write: (0, 0, val)
        new_lines_commands = []
        for line_cmd in order_template.order_line:
            # line_cmd viene como [0, "virtual_X", values] del Order class
            # Lo cambiamos a [0, 0, values] para asegurar compatibilidad con write
            if len(line_cmd) == 3 and line_cmd[0] == 0:
                new_lines_commands.append([0, 0, line_cmd[2]])
            else:
                new_lines_commands.append(line_cmd)
        
        combined_lines = delete_commands + new_lines_commands
        
        # 5. Update values
        update_values = {
            "partner_id": order_data["partner_id"],
            "partner_ref": order_data["partner_ref"],
            "date_order": order_data["date_order"],
            "order_line": combined_lines,
        }
        
        context = {
            "lang": "es_PE", 
            "tz": "America/Lima", 
            "uid": uid
        }
        
        # 6. Ejecutar write
        result = models.execute_kw(
            db, uid, password, 
            "purchase.order", "write", 
            [[po_id], update_values], 
            {"context": context}
        )
        
        if not result:
            raise Exception("Odoo write devolvió False")
            
        # 7. Comentario
        try:
            rpc.create_model("mail.message", {
                "body": f"Actualizado desde Web por: {user.first_name} {user.last_name}",
                "model": "purchase.order",
                "res_id": po_id,
                "message_type": "comment",
            }, uid, proxy=models)
        except:
            pass
            
        return po_id

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e


def get_pending_pickings_by_po_id(po_id):
    """
    Busca recepciones (pickings) pendientes para una Purchase Order.
    Optimizado con batching para evitar el problema N+1.
    """
    proxy = rpc.get_proxy()
    db = settings.ODOO_DB
    uid = int(settings.ODOO_UID)
    pwd = settings.ODOO_PWD
    
    # 1. Obtener datos de la PO
    po_data = proxy.execute_kw(
        db, uid, pwd, 'purchase.order', 'read', [po_id], {'fields': ['name', 'picking_ids']}
    )
    if not po_data:
        return []
    po = po_data[0]

    # 2. Buscar pickings (recepciones) pendientes
    pickings = proxy.execute_kw(
        db, uid, pwd, 'stock.picking', 'search_read',
        [[('id', 'in', po['picking_ids']), ('state', 'not in', ['done', 'cancel'])]],
        {'fields': ['id', 'name', 'move_ids_without_package']}
    )
    
    if not pickings:
        return []

    # 3. Batching: Obtener todos los move_ids de todos los pickings
    all_move_ids = []
    for pick in pickings:
        all_move_ids.extend(pick['move_ids_without_package'])
    
    if not all_move_ids:
        return pickings # Retornar pickings vacíos si no hay movimientos

    # 4. Batching: Obtener todos los moves en una sola llamada
    all_moves = proxy.execute_kw(
        db, uid, pwd, 'stock.move', 'search_read',
        [[('id', 'in', all_move_ids)]],
        {'fields': ['id', 'product_id', 'product_uom_qty', 'picking_id']}
    )

    # 5. Batching: Obtener tracking de todos los productos involucrados
    product_ids = list(set([move['product_id'][0] for move in all_moves]))
    products_info = proxy.execute_kw(
        db, uid, pwd, 'product.product', 'read',
        [product_ids], {'fields': ['tracking']}
    )
    product_tracking_map = {p['id']: p['tracking'] for p in products_info}

    # 6. Batching: Obtener solo move lines con lote asignado (reduce payload/latencia)
    all_move_lines = proxy.execute_kw(
        db, uid, pwd, "stock.move.line", "search_read",
        [[
            ("move_id", "in", all_move_ids),
            "|",
            ("lot_id", "!=", False),
            ("lot_name", "!=", False),
        ]],
        {"fields": ["move_id", "lot_id", "lot_name", "quantity", "expiration_date"]},
    )
    
    # Agrupar move_lines por move_id
    move_lines_map = {}
    for ml in all_move_lines:
        m_id = ml["move_id"][0]
        if m_id not in move_lines_map:
            move_lines_map[m_id] = []
        lot_name = ml.get("lot_name") or (ml["lot_id"][1] if ml.get("lot_id") else "")
        move_lines_map[m_id].append(
            {
                "lot_name": lot_name,
                "quantity": ml.get("quantity") or 0,
                "expiration_date": ml.get("expiration_date") or "",
            }
        )

    # 7. Reconstruir la estructura
    # Mapear moves a sus pickings
    picking_moves_map = {pick['id']: [] for pick in pickings}
    for move in all_moves:
        p_id = move['picking_id'][0]
        prod_id = move['product_id'][0]
        
        move_data = {
            'id': move['id'],
            'product_id': prod_id,
            'product_name': move['product_id'][1],
            'product_uom_qty': move['product_uom_qty'],
            'tracking': product_tracking_map.get(prod_id, 'none'),
            'existing_lots': move_lines_map.get(move['id'], [])
        }
        picking_moves_map[p_id].append(move_data)

    result = []
    for pick in pickings:
        result.append({
            'id': pick['id'],
            'name': pick['name'],
            'moves': picking_moves_map.get(pick['id'], [])
        })
        
    return result


def generate_lots_for_picking(picking_id, lots_config):
    """
    Genera lotes para una recepción específica basándose en la configuración.
    lots_config: { product_id: [{lot_name: str, quantity: float, expiration_date: str}, ...] }
    """
    proxy = rpc.get_proxy()
    db = settings.ODOO_DB
    uid = int(settings.ODOO_UID)
    pwd = settings.ODOO_PWD
    
    # Obtener el picking y sus moves
    pick_data = proxy.execute_kw(
        db, uid, pwd, 'stock.picking', 'read', [picking_id], 
        {'fields': ['move_ids_without_package']}
    )
    if not pick_data:
        raise Exception(f"No se encontró el picking {picking_id}")
    
    picking = pick_data[0]
    move_ids = picking['move_ids_without_package']
    
    # Buscar los moves para mapear product_id -> move_id
    moves = proxy.execute_kw(
        db, uid, pwd, 'stock.move', 'search_read',
        [[('id', 'in', move_ids)]],
        {'fields': ['id', 'product_id']}
    )
    
    product_to_move = {move['product_id'][0]: move['id'] for move in moves}
    
    results = []
    
    for product_id_str, lot_list in lots_config.items():
        product_id = int(product_id_str)
        if product_id not in product_to_move:
            continue
            
        move_id = product_to_move[product_id]
        
        # Limpiar líneas previas (detalles de la operación)
        existing_lines = proxy.execute_kw(
            db, uid, pwd, 'stock.move.line', 'search', 
            [[('move_id', '=', move_id)]]
        )
        if existing_lines:
            proxy.execute_kw(db, uid, pwd, 'stock.move.line', 'unlink', [existing_lines])
        
        # Crear nuevos lotes
        for lot_info in lot_list:
            vals = {
                'picking_id': picking_id,
                'move_id': move_id,
                'product_id': product_id,
                'lot_name': lot_info['lot_name'],
                'quantity': lot_info['quantity'],
            }
            if lot_info.get('expiration_date'):
                vals['expiration_date'] = lot_info['expiration_date']
            
            new_line_id = proxy.execute_kw(db, uid, pwd, 'stock.move.line', 'create', [vals])
            results.append({
                'product_id': product_id,
                'lot_name': lot_info['lot_name'],
                'line_id': new_line_id
            })
            
    return results
