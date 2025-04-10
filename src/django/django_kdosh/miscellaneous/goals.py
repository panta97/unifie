from xmlrpc import client as xmlrpclib
from django.conf import settings
from functools import reduce
from product_rpc.reports.connection import select_df
from datetime import datetime, timedelta
from .models import StoreSectionGoal, StoreGoal
from .constants import (
    ACCESSORIES,
    MEN,
    WOMEN,
    SPORTS,
    HOME,
    CHILDREN,
    CLEARANCE,
    MISCELLANEOUS,
    STORE_SAN_MARTIN,
    STORE_ABTAO,
    STORE_TINGO_MARIA,
)
from product_rpc.utils.invoices import get_series_list


def get_goals_live(date, store):
    # GET ENVIRONMENT VARIABLES
    url = settings.ODOO_URL
    db = settings.ODOO_DB
    pwd = settings.ODOO_PWD
    uid = int(settings.ODOO_UID)

    models = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(url))

    # MOVE
    if store == STORE_ABTAO:
        journal_ids = [
            # LO COMENTADO ES JOURNAL_ID DE LA VERSION 15
            24, # 10,
            25, # 11,
            26, # 12,
            27, # 13,
            28, # 14,
            29, # 15,
            30, # 16,
            33, # 17,
            31, # 18,
            40, # 23,
            83, # 24,
            84, # 25,
            85, # 26,
            86, # 27,
            87, # 28,
            88, # 29,
            89, # 30,
            90, # 31,
        ]
    elif store == STORE_SAN_MARTIN:
        journal_ids = [32, 91] # [19, 32]
    elif store == STORE_TINGO_MARIA:
        journal_ids = [34, 35, 36, 92, 93, 94] # [20, 21, 22, 33, 34, 35]

    move_filters = [
        [
            ["date", "=", date],
            ["state", "=", "posted"],
            ["move_type", "=", "out_invoice"],
            ["journal_id", "in", journal_ids],
        ]
    ]
    move_fields = ["id"]
    moves = models.execute_kw(
        db,
        uid,
        pwd,
        "account.move",
        "search_read",
        move_filters,
        {"fields": move_fields, "context": {"lang": "es_PE"}},
    )
    move_ids = [item["id"] for item in moves]

    # MOVE_LINE
    move_line_filters = [[["move_id", "in", move_ids]]]
    move_line_fields = ["price_total", "product_id"]
    move_lines = models.execute_kw(
        db,
        uid,
        pwd,
        "account.move.line",
        "search_read",
        move_line_filters,
        {"fields": move_line_fields, "context": {"lang": "es_PE"}},
    )
    move_lines = [item for item in move_lines if item["product_id"] != False]
    product_product_ids = [item["product_id"][0] for item in move_lines]

    # PRODUCT_PRODUCT
    product_product_filters = [[["id", "in", product_product_ids]]]
    product_product_fields = ["product_tmpl_id", "pos_categ_ids"]
    product_products = models.execute_kw(
        db,
        uid,
        pwd,
        "product.product",
        "search_read",
        product_product_filters,
        {"fields": product_product_fields, "context": {"lang": "es_PE"}},
    )

    for item in move_lines:
        product_product = [
            product
            for product in product_products
            if product["id"] == item["product_id"][0]
        ][0]
        item["pos_categ_ids"] = product_product["pos_categ_ids"]

    eqs = {
        ACCESSORIES: [38, 45, 46, 50, 64, 67, 43], # [31, 39, 33],
        MEN: [39, 44, 48, 49, 62, 70], # [29, 34, 27, 35, 41],
        WOMEN: [40, 51, 52, 53, 63, 69], # [40, 30, 36, 37],
        SPORTS: [41, 54, 55], # [38],
        HOME: [36, 37, 58, 59, 60], # [26],
        CHILDREN: [42, 61, 65], # [32, 28],
        CLEARANCE: [57], # [42],
        MISCELLANEOUS: [44, 47, 48, 49, 52, 51], # [43, 44, 45, 46, 47, 48, 49, 50, 52, 51],
    }

    lines_group_by_eqs = {
        ACCESSORIES: [],
        MEN: [],
        WOMEN: [],
        SPORTS: [],
        HOME: [],
        CHILDREN: [],
        CLEARANCE: [],
        MISCELLANEOUS: [],
    }

    for item in move_lines:
        if item["pos_categ_ids"] == False:
            continue

        categ_id = item["pos_categ_ids"][0]
        if categ_id in eqs[ACCESSORIES]:
            lines_group_by_eqs[ACCESSORIES].append(item)
        elif categ_id in eqs[MEN]:
            lines_group_by_eqs[MEN].append(item)
        elif categ_id in eqs[WOMEN]:
            lines_group_by_eqs[WOMEN].append(item)
        elif categ_id in eqs[SPORTS]:
            lines_group_by_eqs[SPORTS].append(item)
        elif categ_id in eqs[HOME]:
            lines_group_by_eqs[HOME].append(item)
        elif categ_id in eqs[CHILDREN]:
            lines_group_by_eqs[CHILDREN].append(item)
        elif categ_id in eqs[CLEARANCE]:
            lines_group_by_eqs[CLEARANCE].append(item)
        elif categ_id in eqs[MISCELLANEOUS]:
            lines_group_by_eqs[MISCELLANEOUS].append(item)

    for key, value in lines_group_by_eqs.items():
        lines_group_by_eqs[key] = reduce(lambda x, y: x + y["price_total"], value, 0)

    return lines_group_by_eqs


def get_goals_db(date_from, date_to, store):
    year = date_from.split("-")[0]
    series = []
    if store == STORE_ABTAO:
        series = get_series_list("abtao", year)
    elif store == STORE_SAN_MARTIN:
        series = get_series_list("san_martin", year)
    elif store == STORE_TINGO_MARIA:
        series = get_series_list("tingo_maria", year)
    series = list(map(lambda e: "'{}'".format(e), series))
    series = ",".join(series)

    sql = """
            with temp as
                (
                    SELECT 
                        am.invoice_date AS fecha,
                        CASE
                            WHEN pc.id IN (39, 44, 48, 49, 62, 70) THEN 'MEN'
                            WHEN pc.id IN (41, 54, 55) THEN 'SPORTS'
                            WHEN pc.id IN (38, 45, 46, 50, 64, 67, 43) THEN 'ACCESSORIES'
                            WHEN pc.id IN (40, 51, 52, 53, 63, 69) THEN 'WOMEN'
                            WHEN pc.id IN (36, 37, 58, 59, 60) THEN 'HOME'
                            WHEN pc.id IN (42, 61, 65) THEN 'CHILDREN'
                            WHEN pc.id IN (57) THEN 'CLEARANCE'
                            ELSE 'MISCELLANEOUS'
                        END AS eq,
                        CASE
                            WHEN pc.name::TEXT = '"DESCUENTOS"' THEN 'EN LIQUIDACION'
                            ELSE pc.name::TEXT
                        END AS categoria,
                        aml.price_total AS venta,
                        SUBSTR(am.sequence_prefix, 0, 5) AS serie
                    FROM account_move am
                    LEFT JOIN account_move_line aml ON am.id = aml.move_id
                    LEFT JOIN product_product pp ON aml.product_id = pp.id
                    LEFT JOIN product_template pt ON pp.product_tmpl_id = pt.id
                    LEFT JOIN pos_category_product_template_rel ptpc ON pt.id = ptpc.product_template_id
                    LEFT JOIN pos_category pc ON ptpc.pos_category_id = pc.id
                    WHERE am.company_id = 1  -- kdosh company
                    AND am.move_type = 'out_invoice'
                )
            select eq, sum(venta) venta
            from temp
            where eq <> 'OTROS'
                and fecha between '{}' and '{}'
            group by fecha, eq, categoria
            order by fecha;
        """.format(
        date_from, date_to
    )
    # and serie in ({})
    #     .format(
    #     series, date_from, date_to
    # )
    eq_all = select_df(sql, 17)
    eq_all = eq_all.groupby(["eq"]).sum()
    eq_all = eq_all.to_dict()["venta"]
    return eq_all


def format_goals(*arg):
    # sum or add missing keys
    total = {
        ACCESSORIES: 0,
        MEN: 0,
        WOMEN: 0,
        SPORTS: 0,
        HOME: 0,
        CHILDREN: 0,
        CLEARANCE: 0,
        MISCELLANEOUS: 0,
    }

    for item in arg:
        if item is None:
            continue
        total[ACCESSORIES] += item.get(ACCESSORIES, 0)
        total[MEN] += item.get(MEN, 0)
        total[WOMEN] += item.get(WOMEN, 0)
        total[SPORTS] += item.get(SPORTS, 0)
        total[HOME] += item.get(HOME, 0)
        total[CHILDREN] += item.get(CHILDREN, 0)
        total[CLEARANCE] += item.get(CLEARANCE, 0)
        total[MISCELLANEOUS] += item.get(MISCELLANEOUS, 0)

    return total


def goals(date, store):
    date_obj = datetime.strptime(date, "%Y-%m-%d")
    current_date = datetime.now()

    difference = current_date - date_obj
    day_difference = difference.days

    # Subtract one day using timedelta
    one_day = timedelta(days=1)

    goals_current = None
    goals_cumulative = None

    if day_difference == 0:
        goals_today = get_goals_live(date, store)
        goals_yesterday = None
        goals_rest = None

        # check month
        date_yesterday = date_obj - one_day
        if date_yesterday.month == date_obj.month:
            goals_yesterday = get_goals_live(date_yesterday.strftime("%Y-%m-%d"), store)

            date_rest_from = datetime(date_obj.year, date_obj.month, 1)
            date_rest_to = date_yesterday - one_day
            if date_rest_to.month == date_obj.month:
                goals_rest = get_goals_db(
                    date_rest_from.strftime("%Y-%m-%d"),
                    date_rest_to.strftime("%Y-%m-%d"),
                    store,
                )

        goals_current = format_goals(goals_today)
        goals_cumulative = format_goals(goals_today, goals_yesterday, goals_rest)

    elif day_difference == 1:
        goals_yesterday = get_goals_live(date, store)
        goals_rest = None

        date_rest_from = datetime(date_obj.year, date_obj.month, 1)
        date_rest_to = date_obj - one_day
        if date_rest_to.month == date_obj.month:
            goals_rest = get_goals_db(
                date_rest_from.strftime("%Y-%m-%d"),
                date_rest_to.strftime("%Y-%m-%d"),
                store,
            )
        goals_current = format_goals(goals_yesterday)
        goals_cumulative = format_goals(goals_yesterday, goals_rest)

    else:
        goals_date = get_goals_db(date, date, store)
        goals_rest = None

        date_rest_from = datetime(date_obj.year, date_obj.month, 1)
        date_rest_to = date_obj - one_day
        if date_rest_to.month == date_obj.month:
            goals_rest = get_goals_db(
                date_rest_from.strftime("%Y-%m-%d"),
                date_rest_to.strftime("%Y-%m-%d"),
                store,
            )
        goals_current = format_goals(goals_date)
        goals_cumulative = format_goals(goals_date, goals_rest)

    if store == STORE_ABTAO:
        store_section_goals = StoreSectionGoal.objects.filter(
            year=date_obj.year, month=date_obj.month
        )
        cumulative_list = []
        for item in store_section_goals:
            cumulative_list.append(
                {
                    "section": item.section.section_name,
                    "manager": item.section.supervisor,
                    "year": item.year,
                    "month": item.month,
                    "goal": int(item.goal),
                    "amount": goals_cumulative.get(item.section.section_name, 0),
                }
            )

        return {"selected_day": goals_current, "cumulative": cumulative_list}
    elif store == STORE_TINGO_MARIA:
        store_goal = StoreGoal.objects.get(
            year=date_obj.year, month=date_obj.month, store=STORE_TINGO_MARIA
        )
        goals_current.pop("CLEARANCE")
        goals_current.pop("MISCELLANEOUS")
        goals_cumulative.pop("CLEARANCE")
        goals_cumulative.pop("MISCELLANEOUS")
        return {
            "selected_day": goals_current,
            "cumulative": goals_cumulative,
            "global_goal": int(store_goal.goal),
        }
