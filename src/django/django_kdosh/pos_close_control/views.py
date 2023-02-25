import json
from .rpc import get_proxy, get_model, get_closing_control_data
from datetime import datetime
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import PosSession, Employee


def get_discounts(session_id):
    porder_table = "pos.order"
    porder_filter = [[["session_id", "=", session_id]]]
    porder_fields = [
        "invoice_id",
    ]
    pos_orders = get_model(porder_table, porder_filter, porder_fields)

    ai_ids = [order["invoice_id"][0] for order in pos_orders]
    ai_table = "account.invoice"
    ai_filter = [[["id", "in", ai_ids]]]
    ai_fields = [
        "number",
    ]
    account_invoices = get_model(ai_table, ai_filter, ai_fields)

    ail_table = "account.invoice.line"
    ail_filter = [[["invoice_id", "in", ai_ids]]]
    ail_fields = [
        "invoice_id",
        "name",
        "discount",
        "product_id",
    ]
    account_invoice_lines = get_model(ail_table, ail_filter, ail_fields)

    discounts = []
    for invoice in account_invoices:
        invoice_line = [
            line
            for line in account_invoice_lines
            if line["invoice_id"][0] == invoice["id"]
        ]
        for line in invoice_line:
            if line["discount"] > 0:
                discounts.append(
                    {
                        "invoice_number": invoice["number"],
                        "invoice_id": invoice["id"],
                        "product_desc": line["name"],
                        "discount": line["discount"],
                        "odoo_link": f"{settings.ODOO_URL}/web#id={invoice['id']}&view_type=form&model=account.invoice&menu_id=83&action=388",
                    }
                )

    return discounts


def get_pos_details(request, session_id):
    ps_table = "pos.session"
    ps_filter = [[["id", "=", session_id]]]
    ps_fields = [
        "display_name",  # COULD BE EITHER NAME OR DISPLAY_NAME
        "user_id",
        "config_id",
        "start_at",
        "stop_at",
        "cash_register_balance_end",  # EFECTIVO ODOO (opening + cash sales)
        "statement_ids",
        "total_payments_amount",
        "cash_real_difference",
        "cash_real_expected",
    ]
    proxy = get_proxy()
    pos_session = get_model(ps_table, ps_filter, ps_fields, proxy=proxy)

    # ACCOUNT BANK STATEMENT
    abs_table = "account.bank.statement"
    abs_filter = [[["pos_session_id", "=", session_id]]]
    abs_fields = ["id"]
    account_bank_statements = get_model(abs_table, abs_filter, abs_fields, proxy=proxy)

    # ACCOUNT BANK LINE
    statement_id = account_bank_statements[0]["id"]
    absl_table = "account.bank.statement.line"
    absl_filter = [[["statement_id", "=", statement_id]]]
    absl_fields = ["amount_residual", "is_reconciled", "payment_ref"]
    account_bank_statement_lines = get_model(
        absl_table, absl_filter, absl_fields, proxy=proxy
    )

    absl_sorted = sorted(account_bank_statement_lines, key=lambda x: x["id"])
    opening = 0
    cash_in_outs_total = 0
    if len(absl_sorted) > 0:
        # here opening has cash in and outs
        opening = absl_sorted[0]["amount_residual"]
        # remove first element
        absl_sorted = absl_sorted[1:]
        for item in absl_sorted:
            cash_in_outs_total += item["amount_residual"]
        # remove cash in and outs from opening
        opening += cash_in_outs_total

    # POS PAYMENT
    pp_table = "pos.payment"
    pp_filter = [[["session_id", "=", session_id]]]
    pp_fields = ["amount", "payment_method_id", "session_id"]
    pos_payments = get_model(pp_table, pp_filter, pp_fields, proxy=proxy)

    # include in cash cash ins and outs
    cash = -cash_in_outs_total + opening
    card = 0
    # PAYMENT METHODS (1, 'Efectivo'), (2, 'BCP KDOSH'), (4, 'Nota de Credito')
    for payment in pos_payments:
        if payment["payment_method_id"][0] == 1:
            cash += payment["amount"]
        elif payment["payment_method_id"][0] == 2:
            card += payment["amount"]

    # CHANGE TIMEZONE FORM UTC TO UTC-5
    start_at = pos_session[0]["start_at"]
    stop_at = pos_session[0]["stop_at"]

    result = {
        "pos_name": pos_session[0]["config_id"][1].split()[0],
        "session_id": pos_session[0]["id"],
        "session_name": pos_session[0]["display_name"],
        "balance_start": opening,
        "start_at": start_at,
        "stop_at": stop_at,
        "cash": cash,
        "card": card,
        # "discounts": get_discounts(session_id),
        "discounts": [],
        "is_session_closed": bool(pos_session[0]["stop_at"]),
    }

    data = {
        "statusCode": 200,
        "body": result,
    }

    return JsonResponse(data)


@csrf_exempt
@require_http_methods(["POST"])
def pos_persist(request):
    json_data = json.loads(request.body)

    cashier = Employee.objects.get(id=json_data["cashier"]["id"])
    manager = Employee.objects.get(id=json_data["manager"]["id"])
    start_at = datetime.strptime(json_data["summary"]["startAt"], "%Y-%m-%d %H:%M:%S")
    stop_at = datetime.strptime(json_data["summary"]["stopAt"], "%Y-%m-%d %H:%M:%S")

    new_pos_session = PosSession(
        pos_name=json_data["posName"],
        cashier=cashier,
        manager=manager,
        odoo_session_id=json_data["summary"]["sessionId"],
        odoo_cash=json_data["summary"]["odooCash"],
        odoo_card=json_data["summary"]["odooCard"],
        pos_cash=json_data["summary"]["posCash"],
        pos_card=json_data["summary"]["posCard"],
        profit_total=json_data["summary"]["profitTotal"],
        balance_start=json_data["summary"]["balanceStart"],
        balance_start_next_day=json_data["summary"]["balanceStartNextDay"],
        session_name=json_data["summary"]["sessionName"],
        start_at=start_at,
        stop_at=stop_at,
        end_state=json_data["endState"]["state"],
        end_state_amount=json_data["endState"]["amount"],
        end_state_note=json_data["endState"]["note"],
        json=request.body.decode("utf-8"),
    )

    new_pos_session.save()

    data = {"msj": "POS Details Saved!"}

    return JsonResponse(data)
