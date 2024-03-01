from xmlrpc import client as xmlrpclib
from django.conf import settings
from functools import reduce
from product_rpc.reports.connection import select_df
from datetime import datetime, timedelta
from .models import StoreSectionGoal
from .constants import (
    ACCESSORIES,
    MEN,
    WOMEN,
    SPORTS,
    HOME,
    CHILDREN,
    CLEARANCE,
    MISCELLANEOUS,
)


def get_goals_live(date):
    # GET ENVIRONMENT VARIABLES
    url = settings.ODOO_URL
    db = settings.ODOO_DB
    pwd = settings.ODOO_PWD
    uid = int(settings.ODOO_UID)

    models = xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(url))

    # MOVE
    abtao_journal_ids = [
        10,
        12,
        13,
        14,
        15,
        16,
        17,
        22,
        23,
        25,
        26,
        27,
        28,
        29,
        30,
        35,
    ]
    move_filters = [
        [
            ["date", "=", date],
            ["state", "=", "posted"],
            ["move_type", "in", ["out_invoice"]],
            ["journal_id", "in", abtao_journal_ids],
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
    product_product_fields = ["product_tmpl_id", "pos_categ_id"]
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
        item["pos_categ_id"] = product_product["pos_categ_id"]

    eqs = {
        ACCESSORIES: [31, 39, 33],
        MEN: [29, 34, 27, 35, 41],
        WOMEN: [40, 30, 36, 37],
        SPORTS: [38],
        HOME: [26],
        CHILDREN: [32, 28],
        CLEARANCE: [42],
        MISCELLANEOUS: [43, 44, 45, 46, 47, 48, 49, 50, 52, 51],
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
        if item["pos_categ_id"] == False:
            continue

        categ_id = item["pos_categ_id"][0]
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


def get_goals_db(date_from, date_to, store="AB"):
    series = []
    if store == "AB":
        series = [
            "B001",
            "B003",
            "B004",
            "B005",
            "B006",
            "B007",
            "B008",
            "B013",
            "F001",
            "F003",
            "F004",
            "F005",
            "F006",
            "F007",
            "F008",
            "F013",
        ]
    elif store == "SM":
        series = ["B002", "F002"]
    elif store == "TG":
        series = ["B009", "B010", "B011", "B012", "F009", "F010", "F011", "F012"]
    series = list(map(lambda e: "'{}'".format(e), series))
    series = ",".join(series)

    sql = """
            with temp as
                (
                    select
                        am.invoice_date fecha,
                        case
                            when pc.id in (29, 34, 27, 35, 41) then 'MEN'
                            when pc.id in (38) then 'SPORTS'
                            when pc.id in (31, 39, 33) then 'ACCESSORIES'
                            when pc.id in (40, 30, 36, 37) then 'WOMEN'
                            when pc.id in (26) then 'HOME'
                            when pc.id in (32, 28) then 'CHILDREN'
                            when pc.id in (42) then 'CLEARANCE'
                            else 'MISCELLANEOUS'
                        end eq,
                        case
                            when pc.name = 'DESCUENTOS' then 'EN.LIQUIDACION'
                            else pc.name
                        end categoria,
                        aml.price_total venta,
                        substr(am.sequence_prefix, 0, 5) serie
                    from account_move am
                    left join account_move_line aml
                        on am.id = aml.move_id
                    left join product_product pp
                        on aml.product_id = pp.id
                    left join product_template pt
                        on pp.product_tmpl_id = pt.id
                    left join pos_category pc
                        on pt.pos_categ_id = pc.id
                    where am.company_id = 1 -- kdosh company
                    and am.move_type = 'out_invoice' -- boletas y facturas
                )
            select eq, sum(venta) venta
            from temp
            where eq <> 'OTROS'
                and serie in ({})
                and fecha between '{}' and '{}'
            group by fecha, eq, categoria
            order by fecha;
        """.format(
        series, date_from, date_to
    )
    eq_all = select_df(sql, 15)
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


def goals(date):
    date_obj = datetime.strptime(date, "%Y-%m-%d")
    current_date = datetime.now()

    difference = current_date - date_obj
    day_difference = difference.days

    # Subtract one day using timedelta
    one_day = timedelta(days=1)

    goals_current = None
    goals_cumulative = None

    if day_difference == 0:
        goals_today = get_goals_live(date)
        goals_yesterday = None
        goals_rest = None

        # check month
        date_yesterday = date_obj - one_day
        if date_yesterday.month == date_obj.month:
            goals_yesterday = get_goals_live(date_yesterday.strftime("%Y-%m-%d"))

            date_rest_from = datetime(date_obj.year, date_obj.month, 1)
            date_rest_to = date_yesterday - one_day
            if date_rest_to.month == date_obj.month:
                goals_rest = get_goals_db(
                    date_rest_from.strftime("%Y-%m-%d"),
                    date_rest_to.strftime("%Y-%m-%d"),
                )

        goals_current = format_goals(goals_today)
        goals_cumulative = format_goals(goals_today, goals_yesterday, goals_rest)

    elif day_difference == 1:
        goals_yesterday = get_goals_live(date)
        goals_rest = None

        date_rest_from = datetime(date_obj.year, date_obj.month, 1)
        date_rest_to = date_obj - one_day
        if date_rest_to.month == date_obj.month:
            goals_rest = get_goals_db(
                date_rest_from.strftime("%Y-%m-%d"),
                date_rest_to.strftime("%Y-%m-%d"),
            )
        goals_current = format_goals(goals_yesterday)
        goals_cumulative = format_goals(goals_yesterday, goals_rest)

    else:
        goals_date = get_goals_db(date, date)
        goals_rest = None

        date_rest_from = datetime(date_obj.year, date_obj.month, 1)
        date_rest_to = date_obj - one_day
        if date_rest_to.month == date_obj.month:
            goals_rest = get_goals_db(
                date_rest_from.strftime("%Y-%m-%d"),
                date_rest_to.strftime("%Y-%m-%d"),
            )
        goals_current = format_goals(goals_date)
        goals_cumulative = format_goals(goals_date, goals_rest)

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
