from io import BytesIO
import pandas as pd
from .connection import select_df, select
from ..models import Report
from datetime import datetime
from .constants import DB_ODOO_V15, DB_ODOO_V11


MIGRATION_DATE = "2023-02-27"


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
                    rp.display_name rp_display_name,
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


def get_cpe_all(date_from, date_to):
    date_migration_obj = datetime.strptime(MIGRATION_DATE, "%Y-%m-%d").date()
    date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
    date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()

    if date_migration_obj >= date_to_obj:
        return get_cpe(date_from, date_to, 11)
    elif date_from_obj < date_migration_obj <= date_to_obj:
        cpe_all_11 = get_cpe(date_from, "2023-02-26", 11)
        cpe_all_15 = get_cpe(MIGRATION_DATE, date_to, 15)
        cpe_all = pd.concat([cpe_all_11, cpe_all_15], ignore_index=True)
        return cpe_all
    elif date_migration_obj <= date_from_obj:
        return get_cpe(date_from, date_to, 15)


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
                    on pt.pos_categ_id = pc.id
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
                            when pc_imd.v11_id in (9) or pt.pos_categ_id in (46, 50, 51, 52) then 'EQ HOME'
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
                        on pt.pos_categ_id = pc.id
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


def get_eq_all(date_from, date_to, series):
    date_migration_obj = datetime.strptime(MIGRATION_DATE, "%Y-%m-%d").date()
    date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
    date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()

    if date_migration_obj >= date_to_obj:
        return get_eq(date_from, date_to, series, 11)
    elif date_from_obj < date_migration_obj <= date_to_obj:
        eq_all_11 = get_eq(date_from, "2023-02-26", series, 11)
        eq_all_15 = get_eq(MIGRATION_DATE, date_to, series, 15)
        eq_all = pd.concat([eq_all_11, eq_all_15], ignore_index=True)
        return eq_all
    elif date_migration_obj <= date_from_obj:
        return get_eq(date_from, date_to, series, 15)


def get_eq_report(store, date_from, date_to):
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


def get_fc_all(date_from, date_to):
    date_migration_obj = datetime.strptime(MIGRATION_DATE, "%Y-%m-%d").date()
    date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
    date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()

    if date_migration_obj >= date_to_obj:
        return get_fc(date_from, date_to, 11)
    elif date_from_obj < date_migration_obj <= date_to_obj:
        fc_all_11 = get_fc(date_from, "2023-02-26", 11)
        fc_all_15 = get_fc(MIGRATION_DATE, date_to, 15)
        fc_all = pd.concat([fc_all_11, fc_all_15], ignore_index=True)
        return fc_all
    elif date_migration_obj <= date_from_obj:
        return get_fc(date_from, date_to, 15)


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

    query_result = select(report_obj.query, odoo_db_version, param_dict)

    return query_result
