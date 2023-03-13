from io import BytesIO
import pandas as pd
from .connection import select_df
from datetime import datetime


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
        # TODO: add refund invoices
        sql = """
            with invoice as (
                select
                    substring(am.sequence_prefix, '([B|F])\d{{3}}-') doc_type,
                    substring(am.sequence_prefix, '([B|F]\d{{3}})-') serie,
                    substring(am.name, '[B|F]\d{{3}}-(\d{{8}})') doc_number,
                    rp.vat rp_vat,
                    rp.id rp_id,
                    rp.display_name rp_display_name,
                    am.*
                from account_move am
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
                serie SERIE,
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
                '' TIPOC2,
                '' SERIE2,
                '' NUMERO2,
                '' FECHA2
            from invoice
            where date between '{}' and '{}'
            order by serie, doc_number;
        """.format(
            date_from, date_to
        )
        cpe_all = select_df(sql, 15)
        return cpe_all


def get_cpe_all(date_from, date_to):
    MIGRATION_DATE = "2023-02-27"
    date_migration_obj = datetime.strptime(MIGRATION_DATE, "%Y-%m-%d").date()
    date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
    date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()

    if date_migration_obj >= date_to_obj:
        print("only 11")
        return get_cpe(date_from, date_to, 11)
    elif date_from_obj < date_migration_obj <= date_to_obj:
        print("both 11 and 15")
        cpe_all_11 = get_cpe(date_from, "2023-02-26", 11)
        cpe_all_15 = get_cpe(MIGRATION_DATE, date_to, 15)
        cpe_all = pd.concat([cpe_all_11, cpe_all_15], ignore_index=True)
        return cpe_all
    elif date_migration_obj >= date_from_obj:
        print("only 15")
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

    writer.save()
    output.seek(0)
    workbook = output.read()
    return (workbook, filename)


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

    writer.save()
    output.seek(0)
    workbook = output.read()
    return (workbook, filename)


def get_fc_report(date_from, date_to):
    sql = """
        select numero_odoo,
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

    invoice_all = select_df(sql, 11)
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

    writer.save()
    output.seek(0)
    workbook = output.read()
    return (workbook, filename)
