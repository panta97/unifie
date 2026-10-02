from io import BytesIO
import re
import xmlrpc.client
from datetime import datetime
import pandas as pd
from django.conf import settings
from .connection import select_df, select
from ..models import Report
from .constants import DB_ODOO_V17, DB_ODOO_V15, DB_ODOO_V11
from product_rpc.utils.invoices import get_series_list


MIGRATION_DATE = "2023-02-27"


def _get_odoo_rpc():
    url = getattr(settings, "ODOO_URL", "http://localhost:8069")
    db = getattr(settings, "ODOO_DB", "odoo17_enterprise")
    uid = int(getattr(settings, "ODOO_UID", 2))
    pwd = getattr(settings, "ODOO_PWD", None) or getattr(settings, "ODOO_PASSWORD", "")
    proxy = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/object")
    return proxy, db, uid, pwd


def get_cpe_rpc(date_from, date_to):
    proxy, db, uid, pwd = _get_odoo_rpc()
    domain = [
        ["move_type", "in", ["out_invoice", "out_refund"]],
        ["invoice_date", ">=", date_from],
        ["invoice_date", "<=", date_to],
        ["state", "!=", "cancel"],
    ]
    fields = [
        "id", "name", "invoice_date", "invoice_date_due",
        "partner_id", "amount_total", "sequence_prefix", "reversed_entry_id",
    ]
    moves = proxy.execute_kw(
        db, uid, pwd,
        "account.move", "search_read",
        [domain], {"fields": fields}
    )
    if not moves:
        return pd.DataFrame(columns=[
            "FECHAE", "FECHAV", "TIPOC", "SERIE", "NUMERO", "TIPODOC",
            "DOCUMENTO", "NOMBRE", "BASEI", "IGV", "EXONERADO", "RETENCION",
            "TOTAL", "TIPOC2", "SERIE2", "NUMERO2", "FECHA2",
        ])

    partner_ids = list(set([m["partner_id"][0] for m in moves if m.get("partner_id")]))
    partners = {}
    if partner_ids:
        for i in range(0, len(partner_ids), 500):
            chunk = partner_ids[i:i + 500]
            p_data = proxy.execute_kw(
                db, uid, pwd,
                "res.partner", "search_read",
                [[["id", "in", chunk]]], {"fields": ["id", "name", "vat"]}
            )
            for p in p_data:
                partners[p["id"]] = p

    rev_ids = list(set([m["reversed_entry_id"][0] for m in moves if m.get("reversed_entry_id")]))
    reversed_moves = {}
    if rev_ids:
        for i in range(0, len(rev_ids), 500):
            chunk = rev_ids[i:i + 500]
            r_data = proxy.execute_kw(
                db, uid, pwd,
                "account.move", "search_read",
                [[["id", "in", chunk]]], {"fields": ["id", "name", "invoice_date", "sequence_prefix"]}
            )
            for r in r_data:
                reversed_moves[r["id"]] = r

    rows = []
    for m in moves:
        name = (m.get("name") or "").strip()
        seq = (m.get("sequence_prefix") or "").strip()
        clean_name = re.sub(r"\s+", "", name)
        clean_seq = re.sub(r"\s+", "", seq)

        m_serie = re.search(r"([BF]\w{3})-?", clean_seq) or re.search(r"([BF]\w{3})-", clean_name)
        m_doc = re.search(r"[BF]\w{3}-(\d+)", clean_name)
        if not m_serie or not m_doc:
            continue
        serie = m_serie.group(1)
        doc_number = m_doc.group(1)
        doc_type = serie[0]
        tipoc = "03" if doc_type == "B" else "01"
        tipodoc = "1" if doc_type == "B" else "6"

        pid = m["partner_id"][0] if m.get("partner_id") else None
        partner = partners.get(pid, {})
        vat = partner.get("vat") or ""
        pname = partner.get("name") or (m["partner_id"][1] if m.get("partner_id") else "")

        rev_id = m["reversed_entry_id"][0] if m.get("reversed_entry_id") else None
        rev = reversed_moves.get(rev_id, {})
        rev_name = re.sub(r"\s+", "", rev.get("name") or "")
        rev_match = re.search(r"([BF]\w{3})-(\d+)", rev_name)
        tipoc2 = ""
        serie2 = ""
        doc_number2 = ""
        date2 = None
        if rev_match:
            s2 = rev_match.group(1)
            tipoc2 = "03" if s2[0] == "B" else "01"
            serie2 = s2
            doc_number2 = rev_match.group(2)
            date2 = rev.get("invoice_date")

        total = float(m.get("amount_total") or 0)
        rows.append({
            "FECHAE": m.get("invoice_date"),
            "FECHAV": m.get("invoice_date_due") or m.get("invoice_date"),
            "TIPOC": tipoc,
            "SERIE": serie,
            "NUMERO": doc_number,
            "TIPODOC": tipodoc,
            "DOCUMENTO": vat,
            "NOMBRE": pname,
            "BASEI": 0,
            "IGV": 0,
            "EXONERADO": total,
            "RETENCION": 0,
            "TOTAL": total,
            "TIPOC2": tipoc2,
            "SERIE2": serie2,
            "NUMERO2": doc_number2,
            "FECHA2": date2,
        })
    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.sort_values(by=["SERIE", "NUMERO"]).reset_index(drop=True)
    return df


def get_fc_rpc(date_from, date_to):
    proxy, db, uid, pwd = _get_odoo_rpc()
    domain = [
        ["move_type", "=", "in_invoice"],
        ["invoice_date", ">=", date_from],
        ["invoice_date", "<=", date_to],
        ["state", "!=", "cancel"],
    ]
    fields = [
        "id", "partner_id", "ref", "invoice_origin",
        "payment_reference", "invoice_date", "invoice_date_due",
        "amount_untaxed", "amount_tax", "amount_total", "payment_state",
    ]
    moves = proxy.execute_kw(
        db, uid, pwd,
        "account.move", "search_read",
        [domain], {"fields": fields}
    )
    if not moves:
        return pd.DataFrame(columns=[
            "numero_odoo", "ruc", "proveedor", "referencia_proveedor",
            "numero_op", "numero_factura", "fecha_factura", "fecha_vencimiento",
            "venta", "igv", "importe", "estado",
        ])

    partner_ids = list(set([m["partner_id"][0] for m in moves if m.get("partner_id")]))
    partners = {}
    if partner_ids:
        for i in range(0, len(partner_ids), 500):
            chunk = partner_ids[i:i + 500]
            p_data = proxy.execute_kw(
                db, uid, pwd,
                "res.partner", "search_read",
                [[["id", "in", chunk]]], {"fields": ["id", "name", "vat"]}
            )
            for p in p_data:
                partners[p["id"]] = p

    rows = []
    state_map = {"not_paid": "abierto", "in_payment": "pagado", "paid": "pagado"}
    for m in moves:
        mid = m["id"]
        pid = m["partner_id"][0] if m.get("partner_id") else None
        partner = partners.get(pid, {})
        estado = state_map.get(m.get("payment_state"), m.get("payment_state") or "")
        rows.append({
            "numero_odoo": f"FP01-{mid}",
            "ruc": partner.get("vat") or "",
            "proveedor": partner.get("name") or (m["partner_id"][1] if m.get("partner_id") else ""),
            "referencia_proveedor": m.get("ref") or "",
            "numero_op": m.get("invoice_origin") or "",
            "numero_factura": m.get("payment_reference") or "",
            "fecha_factura": m.get("invoice_date"),
            "fecha_vencimiento": m.get("invoice_date_due"),
            "venta": float(m.get("amount_untaxed") or 0),
            "igv": float(m.get("amount_tax") or 0),
            "importe": float(m.get("amount_total") or 0),
            "estado": estado,
        })

    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.sort_values(by="fecha_factura").reset_index(drop=True)
    return df


def get_eq_rpc(date_from, date_to, series_str):
    proxy, db, uid, pwd = _get_odoo_rpc()
    series_list = [s.strip(" '\"") for s in series_str.split(",") if s.strip(" '\"")]

    eq_caballero = {2, 4, 5, 11, 17}
    eq_deportivo = {8}
    eq_accesorio = {3, 13, 15}
    eq_dama = {6, 7, 12, 16}
    eq_home_v11 = {9}
    eq_home_categs = {46, 50, 51, 52}
    eq_nino = {10, 14}
    eq_liquidacion = {1}

    imd_data = proxy.execute_kw(
        db, uid, pwd,
        "ir.model.data", "search_read",
        [[["model", "=", "pos.category"]]],
        {"fields": ["name", "res_id"]}
    )
    pc_map = {}
    for imd in imd_data:
        m_v11 = re.search(r"pos_category_(\d+)", imd.get("name") or "")
        if m_v11:
            pc_map[imd["res_id"]] = int(m_v11.group(1))

    pc_data = proxy.execute_kw(
        db, uid, pwd,
        "pos.category", "search_read",
        [[]],
        {"fields": ["id", "name"]}
    )
    pc_names = {pc["id"]: pc["name"] for pc in pc_data}

    domain = [
        ["move_id.move_type", "=", "out_invoice"],
        ["date", ">=", date_from],
        ["date", "<=", date_to],
        ["move_id.state", "!=", "cancel"],
    ]
    fields = ["id", "date", "price_total", "product_id", "move_id"]
    lines = proxy.execute_kw(
        db, uid, pwd,
        "account.move.line", "search_read",
        [domain], {"fields": fields}
    )
    if not lines:
        return pd.DataFrame(columns=["FECHA", "EQ", "CATEGORIA", "VENTA"])

    product_ids = list(set([l["product_id"][0] for l in lines if l.get("product_id")]))
    products = {}
    if product_ids:
        for i in range(0, len(product_ids), 500):
            chunk = product_ids[i:i + 500]
            prod_data = proxy.execute_kw(
                db, uid, pwd,
                "product.product", "search_read",
                [[["id", "in", chunk]]],
                {"fields": ["id", "pos_categ_ids"]}
            )
            for p in prod_data:
                products[p["id"]] = p.get("pos_categ_ids") or []

    rows = []
    for l in lines:
        move_name = l["move_id"][1] if l.get("move_id") else ""
        clean_move_name = re.sub(r"\s+", "", move_name)
        m_serie = re.search(r"([BF]\w{3})-", clean_move_name)
        serie = m_serie.group(1) if m_serie else ""
        if series_list and serie not in series_list:
            continue

        prod_id = l["product_id"][0] if l.get("product_id") else None
        pos_categ_ids = products.get(prod_id, [])
        pc_id = pos_categ_ids[0] if pos_categ_ids else None

        v11_id = pc_map.get(pc_id)
        eq = "OTROS"
        if v11_id in eq_caballero:
            eq = "EQ CABALLERO"
        elif v11_id in eq_deportivo:
            eq = "EQ DEPORTIVO"
        elif v11_id in eq_accesorio:
            eq = "EQ ACCESORIO"
        elif v11_id in eq_dama:
            eq = "EQ DAMA"
        elif v11_id in eq_home_v11 or any(cid in eq_home_categs for cid in pos_categ_ids):
            eq = "EQ HOME"
        elif v11_id in eq_nino:
            eq = "EQ NINO"
        elif v11_id in eq_liquidacion:
            eq = "LIQUIDACION"

        if eq == "OTROS":
            continue

        raw_cat_name = pc_names.get(pc_id, "")
        categoria = "EN.LIQUIDACION" if raw_cat_name == "DESCUENTOS" else raw_cat_name

        rows.append({
            "FECHA": l.get("date"),
            "EQ": eq,
            "CATEGORIA": categoria,
            "VENTA": float(l.get("price_total") or 0),
        })

    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.groupby(["FECHA", "EQ", "CATEGORIA"], as_index=False)["VENTA"].sum()
        df = df.sort_values(by="FECHA").reset_index(drop=True)
    else:
        df = pd.DataFrame(columns=["FECHA", "EQ", "CATEGORIA", "VENTA"])
    return df


def get_cpe(date_from, date_to, odoo_version):
    if odoo_version == 11:
        sql = """
            select distinct fecha FECHAE,
                    fecha FECHAV,
                    tipo_cpe TIPOC,
                    serie SERIE,
                    numero NUMERO,
                    tipo_documento TIPODOC,
                    documento DOCUMENTO,
                    razon_social NOMBRE,
                    0 BASEI,
                    0 IGV,
                    total EXONERADO,
                    0 RETENCION,
                    total TOTAL,
                    tipo_cpe_nc TIPOC2,
                    serie_nc SERIE2,
                    numero_nc NUMERO2,
                    fecha_nc FECHA2
            from ose.cpe
            where fecha between '{}' and '{}'
            order by serie, numero;
        """.format(
            date_from, date_to
        )
        cpe_all = select_df(sql, 11)
        return cpe_all
    elif odoo_version == 15:
        sql = """
            with invoice as (
                select
                    am.date,
                    substring(regexp_replace(am.sequence_prefix, '\s+', ''), '([B|F])\w{{3}}-') doc_type,
                    substring(regexp_replace(am.sequence_prefix, '\s+', ''), '([B|F]\w{{3}})-') serie,
                    substring(regexp_replace(am.name, '\s+', ''), '[B|F]\w{{3}}-(\d{{8}})') doc_number,
                    rp.vat rp_vat,
                    rp.id rp_id,
                    rp.rp_display_name rp_display_name,
                    am.amount_total,
                    am2.date date2,
                    substring(regexp_replace(am2.sequence_prefix, '\s+', ''), '([B|F])\w{{3}}-') doc_type2,
                    substring(regexp_replace(am2.sequence_prefix, '\s+', ''), '([B|F]\w{{3}})-') serie2,
                    substring(regexp_replace(am2.name, '\s+', ''), '[B|F]\w{{3}}-(\d{{8}})') doc_number2
                from account_move am
                left join account_move am2
                    on am.reversed_entry_id = am2.id
                left join res_partner rp
                    on am.partner_id = rp.id
                where am.move_type in ('out_invoice', 'out_refund')
            )
            select
                date FECHAE,
                date FECHAV,
                case
                    when doc_type = 'B' then '03'
                    when doc_type = 'F' then '01'
                else '-' end TIPOC,
                serie "SERIE",
                doc_number NUMERO,
                case
                    when doc_type = 'B' then '1'
                    when doc_type = 'F' then '6'
                else '-' end TIPODOC,
                rp_vat DOCUMENTO,
                rp_display_name NOMBRE,
                0 BASEI,
                0 IGV,
                amount_total EXONERADO,
                0 RETENCION,
                amount_total TOTAL,
                case
                    when doc_type2 = 'B' then '03'
                    when doc_type2 = 'F' then '01'
                else '' end TIPOC2,
                serie2 "SERIE2",
                doc_number2 NUMERO2,
                date2 FECHA2
            from invoice
            where date between '{}' and '{}' and serie is not null
            order by serie, doc_number;
        """.format(
            date_from, date_to
        )
        cpe_all = select_df(sql, 15)
        return cpe_all
    elif odoo_version == 17:
        try:
            return get_cpe_rpc(date_from, date_to)
        except Exception as rpc_err:
            print("XML-RPC get_cpe failed, falling back to SQL:", rpc_err)
            sql = """
                with invoice as (
                    select
                        am.date,
                        substring(regexp_replace(am.sequence_prefix, '\s+', ''), '([B|F])\w{{3}}-') doc_type,
                        substring(regexp_replace(am.sequence_prefix, '\s+', ''), '([B|F]\w{{3}})-') serie,
                        substring(regexp_replace(am.name, '\s+', ''), '[B|F]\w{{3}}-(\d+)') doc_number,
                        rp.vat rp_vat,
                        rp.id rp_id,
                        rp.name rp_display_name,
                        am.amount_total,
                        am2.date date2,
                        substring(regexp_replace(am2.sequence_prefix, '\s+', ''), '([B|F])\w{{3}}-') doc_type2,
                        substring(regexp_replace(am2.sequence_prefix, '\s+', ''), '([B|F]\w{{3}})-') serie2,
                        substring(regexp_replace(am2.name, '\s+', ''), '[B|F]\w{{3}}-(\d+)') doc_number2
                    from account_move am
                    left join account_move am2
                        on am.reversed_entry_id = am2.id
                    left join res_partner rp
                        on am.partner_id = rp.id
                    where am.move_type in ('out_invoice', 'out_refund')
                )
                select
                    date FECHAE,
                    date FECHAV,
                    case
                        when doc_type = 'B' then '03'
                        when doc_type = 'F' then '01'
                    else '-' end TIPOC,
                    serie "SERIE",
                    doc_number NUMERO,
                    case
                        when doc_type = 'B' then '1'
                        when doc_type = 'F' then '6'
                    else '-' end TIPODOC,
                    rp_vat DOCUMENTO,
                    rp_display_name NOMBRE,
                    0 BASEI,
                    0 IGV,
                    amount_total EXONERADO,
                    0 RETENCION,
                    amount_total TOTAL,
                    case
                        when doc_type2 = 'B' then '03'
                        when doc_type2 = 'F' then '01'
                    else '' end TIPOC2,
                    serie2 "SERIE2",
                    doc_number2 NUMERO2,
                    date2 FECHA2
                from invoice
                where date between '{}' and '{}' and serie is not null
                order by serie, doc_number;
            """.format(
                date_from, date_to
            )
            cpe_all = select_df(sql, 17)
            return cpe_all


def get_cpe_all(date_from, date_to):
    date_migration_obj = datetime.strptime(MIGRATION_DATE, "%Y-%m-%d").date()
    date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
    date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()

    if date_migration_obj >= date_to_obj:
        return get_cpe(date_from, date_to, 11)
    elif date_from_obj < date_migration_obj <= date_to_obj:
        cpe_all_11 = get_cpe(date_from, "2023-02-26", 11)
        cpe_all_15 = get_cpe(MIGRATION_DATE, date_to, 15)
        cpe_all_17 = get_cpe(MIGRATION_DATE, date_to, 17)
        cpe_all = pd.concat([cpe_all_11, cpe_all_15, cpe_all_17], ignore_index=True)
        return cpe_all
    elif date_migration_obj <= date_from_obj:
        return get_cpe(date_from, date_to, 17)


def get_cpe_report(company_id, date_from, date_to):
    table = ""
    if company_id == 1:
        table = "cpe"
    elif company_id == 3:
        table = "cpeolympo"

    cpe_all = get_cpe_all(date_from, date_to)
    if cpe_all.shape[0] == 0:
        raise Exception("Sin datos")
    cpe_all.columns = [col.upper() for col in cpe_all.columns]
    cpe_series = []

    series = cpe_all["SERIE"].unique().tolist()
    for serie in series:
        aux_df = None
        aux_df = cpe_all.loc[cpe_all["SERIE"] == serie]
        cpe_series.append(aux_df)

    company = ""
    if company_id == 1:
        company = "KDOSH"
    elif company_id == 3:
        company = "OLYMPO"

    output = BytesIO()
    filename = "VENTAS_{}_{}_{}.xlsx".format(company, date_from, date_to)
    writer = pd.ExcelWriter(output, engine="xlsxwriter")
    for cpe_serie in cpe_series:
        # cpe_serie.iloc[0][3] IS HARCODED
        cpe_serie.to_excel(writer, sheet_name=cpe_serie.iloc[0][3], index=False)

    # set column widths for dates
    for cpe_serie in cpe_series:
        worksheet = writer.sheets[cpe_serie.iloc[0][3]]
        worksheet.set_column("A:B", 10)

    writer.close()
    output.seek(0)
    workbook = output.read()
    return (workbook, filename)


def get_eq(date_from, date_to, series, odoo_version):
    if odoo_version == 11:
        sql = """
            with temp as
            (
                select
                    ai.date_invoice fecha,
                    case
                            when pc.id in (2, 4, 5, 11, 17) then 'EQ CABALLERO'
                            when pc.id in (8) then 'EQ DEPORTIVO'
                            when pc.id in (3, 13, 15) then 'EQ ACCESORIO'
                            when pc.id in (6, 7, 12, 16) then 'EQ DAMA'
                            when pc.id in (9) then 'EQ HOME'
                            when pc.id in (10, 14) then 'EQ NINO'
                            when pc.id in (1) then 'LIQUIDACION'
                            else 'OTROS'
                        end eq,
                        case
                            when pc.name = 'DESCUENTOS' then 'EN.LIQUIDACION'
                            else pc.name
                        end categoria,
                    ail.price_total venta,
                    substr(ai.number, 0, 5) serie
                from account_invoice ai
                left join account_invoice_line ail
                    on ai.id = ail.invoice_id
                left join product_product pp
                    on ail.product_id = pp.id
                left join product_template pt
                    on pp.product_tmpl_id = pt.id
                left join pos_category pc
                    on pt.pos_categ_ids = pc.id
                where ai.company_id = 1 -- kdosh company
                and ai.type = 'out_invoice' -- boletas y facturas
                )
            select fecha, eq, categoria, sum(venta) venta
            from temp
            where eq <> 'OTROS'
                and serie in ({})
                and fecha between '{}' and '{}'
            group by fecha, eq, categoria
            order by fecha;
        """.format(
            series, date_from, date_to
        )
        eq_all = select_df(sql, 11)
        return eq_all
    elif odoo_version == 15:
        sql = """
            with temp as
                (
                    select
                        am.invoice_date fecha,
                        case
                            when pc_imd.v11_id in (2, 4, 5, 11, 17) then 'EQ CABALLERO'
                            when pc_imd.v11_id in (8) then 'EQ DEPORTIVO'
                            when pc_imd.v11_id in (3, 13, 15) then 'EQ ACCESORIO'
                            when pc_imd.v11_id in (6, 7, 12, 16) then 'EQ DAMA'
                            when pc_imd.v11_id in (9) or pt.pos_categ_ids in (46, 50, 51, 52) then 'EQ HOME'
                            when pc_imd.v11_id in (10, 14) then 'EQ NINO'
                            when pc_imd.v11_id in (1) then 'LIQUIDACION'
                            else 'OTROS'
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
                        on pt.pos_categ_ids = pc.id
                    left join (
                        select
                            cast(substring(name, 'pos_category_(\d+)') as integer) v11_id,
                            res_id
                        from ir_model_data imd
                        where imd.model = 'pos.category'
                    ) as pc_imd
                        on pc.id = pc_imd.res_id
                    where am.company_id = 1 -- kdosh company
                    and am.move_type = 'out_invoice' -- boletas y facturas
                )
            select fecha, eq, categoria, sum(venta) venta
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
        return eq_all
    elif odoo_version == 17:
        try:
            return get_eq_rpc(date_from, date_to, series)
        except Exception as rpc_err:
            print("XML-RPC get_eq failed, falling back to SQL:", rpc_err)
            sql = """
                with temp as
                    (
                        select
                            am.invoice_date fecha,
                            case
                                when pc_imd.v11_id in (2, 4, 5, 11, 17) then 'EQ CABALLERO'
                                when pc_imd.v11_id in (8) then 'EQ DEPORTIVO'
                                when pc_imd.v11_id in (3, 13, 15) then 'EQ ACCESORIO'
                                when pc_imd.v11_id in (6, 7, 12, 16) then 'EQ DAMA'
                                when pc_imd.v11_id in (9) or pt.pos_categ_ids in (46, 50, 51, 52) then 'EQ HOME'
                                when pc_imd.v11_id in (10, 14) then 'EQ NINO'
                                when pc_imd.v11_id in (1) then 'LIQUIDACION'
                                else 'OTROS'
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
                            on pt.pos_categ_ids = pc.id
                        left join (
                            select
                                cast(substring(name, 'pos_category_(\d+)') as integer) v11_id,
                                res_id
                            from ir_model_data imd
                            where imd.model = 'pos.category'
                        ) as pc_imd
                            on pc.id = pc_imd.res_id
                        where am.company_id = 1 -- kdosh company
                        and am.move_type = 'out_invoice' -- boletas y facturas
                    )
                select fecha, eq, categoria, sum(venta) venta
                from temp
                where eq <> 'OTROS'
                    and serie in ({})
                    and fecha between '{}' and '{}'
                group by fecha, eq, categoria
                order by fecha;
            """.format(
                series, date_from, date_to
            )
            eq_all = select_df(sql, 17)
            return eq_all


def get_eq_all(date_from, date_to, series):
    date_migration_obj = datetime.strptime(MIGRATION_DATE, "%Y-%m-%d").date()
    date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
    date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()

    if date_migration_obj >= date_to_obj:
        return get_eq(date_from, date_to, series, 11)
    elif date_from_obj < date_migration_obj <= date_to_obj:
        eq_all_11 = get_eq(date_from, "2023-02-26", series, 11)
        eq_all_15 = get_eq(MIGRATION_DATE, date_to, series, 15)
        eq_all_17 = get_eq(MIGRATION_DATE, date_to, series, 17)
        eq_all = pd.concat([eq_all_11, eq_all_15, eq_all_17], ignore_index=True)
        return eq_all
    elif date_migration_obj <= date_from_obj:
        return get_eq(date_from, date_to, series, 17)


def get_eq_report(store, date_from, date_to):
    year = date_from.split("-")[0]
    series = []
    if store == "AB":
        series = get_series_list("abtao", year)
    elif store == "SM":
        series = get_series_list("san_martin", year)
    elif store == "TG":
        series = get_series_list("tingo_maria", year)
    series = list(map(lambda e: "'{}'".format(e), series))
    series = ",".join(series)

    # eq_all is None
    eq_all = get_eq_all(date_from, date_to, series)
    if eq_all.shape[0] == 0:
        raise Exception("Sin datos")
    eq_all.columns = [col.upper() for col in eq_all.columns]
    eq_dfs = []

    eqs = eq_all["EQ"].unique().tolist()
    for eq in eqs:
        aux_df = None
        aux_df = eq_all.loc[eq_all["EQ"] == eq]
        eq_dfs.append(aux_df)

    output = BytesIO()
    filename = "EQ_{}_{}_{}.xlsx".format(store, date_from, date_to)
    writer = pd.ExcelWriter(output, engine="xlsxwriter")
    for eq in eq_dfs:
        eq.to_excel(writer, sheet_name=eq.iloc[0][1], index=False)

    # set column widths for dates
    for eq in eq_dfs:
        worksheet = writer.sheets[eq.iloc[0][1]]
        worksheet.set_column("A:A", 10)

    writer.close()
    output.seek(0)
    workbook = output.read()
    return (workbook, filename)


def get_fc(date_from, date_to, odoo_version):
    if odoo_version == 11:
        sql = """
            select numero_odoo,
                    ruc,
                    proveedor,
                    referencia_proveedor,
                    numero_op,
                    numero_factura,
                    fecha_factura,
                    fecha_vencimiento,
                    venta,
                    igv,
                    importe,
                    case
                        when estado = 'open' then 'abierto'
                        when estado = 'paid' then 'pagado'
                        else estado end estado
            from (
                        select ai.number                        numero_odoo,
                            rp.doc_number                        ruc,
                            rp.name                       proveedor,
                            po.partner_ref               referencia_proveedor,
                            po.name                      numero_op,
                            concat('F', right(ai.l10n_pe_doc_serie, length(ai.l10n_pe_doc_serie) - 1), '-',
                                    ai.l10n_pe_doc_number) numero_factura,
                            ai.date_invoice                  fecha_factura,
                            ai.date_due                      fecha_vencimiento,
                            ai.amount_untaxed                venta,
                            ai.amount_tax                    igv,
                            ai.amount_total                  importe,
                            ai.state                      estado
                        from account_invoice ai
                                left join purchase_order po
                                        on ai.origin = po.name
                                left join res_partner rp
                                        on ai.partner_filtered_id = rp.id
                        where ai.type = 'in_invoice'
                        and ai.journal_sunat_type = '01'
                    ) t
            where fecha_factura between '{}' and '{}'
            order by fecha_factura;
        """.format(
            date_from, date_to
        )
        fc_all = select_df(sql, 11)
        return fc_all
    elif odoo_version == 15:
        sql = """
            select  numero_odoo,
            ruc,
            proveedor,
            referencia_proveedor,
            numero_op,
            numero_factura,
            fecha_factura,
            fecha_vencimiento,
            venta,
            igv,
            importe,
            case
                when estado = 'not_paid' then 'abierto'
                when estado = 'in_payment' then 'pagado'
                when estado = 'paid' then 'pagado'
                else estado end estado
            from (select concat('FP01-', am.id) numero_odoo,
                    rp.vat                 ruc,
                    rp.name                proveedor,
                    am.ref                 referencia_proveedor,
                    am.invoice_origin      numero_op,
                    am.payment_reference   numero_factura,
                    am.invoice_date        fecha_factura,
                    am.invoice_date_due    fecha_vencimiento,
                    am.amount_untaxed      venta,
                    am.amount_tax          igv,
                    am.amount_total        importe,
                    am.payment_state       estado
            from account_move am
                    left join purchase_order po
                                on am.invoice_origin = po.name
                    left join res_partner rp
                                on am.partner_id = rp.id
            where am.move_type = 'in_invoice'
                and am.journal_id = 2
            ) t
            where fecha_factura between '{}' and '{}'
            order by fecha_factura
        """.format(
            date_from, date_to
        )
        fc_all = select_df(sql, 15)
        return fc_all
    elif odoo_version == 17:
        try:
            return get_fc_rpc(date_from, date_to)
        except Exception as rpc_err:
            print("XML-RPC get_fc failed, falling back to SQL:", rpc_err)
            sql = """
                select  numero_odoo,
                ruc,
                proveedor,
                referencia_proveedor,
                numero_op,
                numero_factura,
                fecha_factura,
                fecha_vencimiento,
                venta,
                igv,
                importe,
                case
                    when estado = 'not_paid' then 'abierto'
                    when estado = 'in_payment' then 'pagado'
                    when estado = 'paid' then 'pagado'
                    else estado end estado
                from (select concat('FP01-', am.id) numero_odoo,
                        rp.vat                 ruc,
                        rp.name                proveedor,
                        am.ref                 referencia_proveedor,
                        am.invoice_origin      numero_op,
                        am.payment_reference   numero_factura,
                        am.invoice_date        fecha_factura,
                        am.invoice_date_due    fecha_vencimiento,
                        am.amount_untaxed      venta,
                        am.amount_tax          igv,
                        am.amount_total        importe,
                        am.payment_state       estado
                from account_move am
                        left join purchase_order po
                                    on am.invoice_origin = po.name
                        left join res_partner rp
                                    on am.partner_id = rp.id
                where am.move_type = 'in_invoice'
                    and am.journal_id = 2
                ) t
                where fecha_factura between '{}' and '{}'
                order by fecha_factura
            """.format(
                date_from, date_to
            )
            fc_all = select_df(sql, 17)
            return fc_all


def get_fc_all(date_from, date_to):
    date_migration_obj = datetime.strptime(MIGRATION_DATE, "%Y-%m-%d").date()
    date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
    date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()

    if date_migration_obj >= date_to_obj:
        return get_fc(date_from, date_to, 11)
    elif date_from_obj < date_migration_obj <= date_to_obj:
        fc_all_11 = get_fc(date_from, "2023-02-26", 11)
        fc_all_15 = get_fc(MIGRATION_DATE, date_to, 15)
        fc_all_17 = get_fc(MIGRATION_DATE, date_to, 17)
        fc_all = pd.concat([fc_all_11, fc_all_15, fc_all_17], ignore_index=True)
        return fc_all
    elif date_migration_obj <= date_from_obj:
        return get_fc(date_from, date_to, 17)


def get_fc_report(date_from, date_to):
    invoice_all = get_fc_all(date_from, date_to)
    if invoice_all.shape[0] == 0:
        raise Exception("Sin datos")
    output = BytesIO()
    filename = "COMPRAS_KDOSH_{}_{}.xlsx".format(date_from, date_to)
    writer = pd.ExcelWriter(output, engine="xlsxwriter")
    sheet_name = "COMPRAS"
    invoice_all.to_excel(writer, sheet_name=sheet_name, index=False)

    for column in invoice_all:
        column_length = max(invoice_all[column].astype(str).map(len).max(), len(column))
        col_idx = invoice_all.columns.get_loc(column)
        writer.sheets[sheet_name].set_column(col_idx, col_idx, column_length)

    writer.close()
    output.seek(0)
    workbook = output.read()
    return (workbook, filename)


def get_report_dynamic(report):
    report_obj = Report.objects.get(id=report["id"])
    param_dict = {}
    for param in report["params"]:
        param_dict[param["name"]] = param["value"]

    odoo_db_version = 0
    if report_obj.db_target == DB_ODOO_V11:
        odoo_db_version = 11
    elif report_obj.db_target == DB_ODOO_V15:
        odoo_db_version = 15
    elif report_obj.db_target == DB_ODOO_V17:
        odoo_db_version = 17

    query_result = select(report_obj.query, odoo_db_version, param_dict)

    return query_result
