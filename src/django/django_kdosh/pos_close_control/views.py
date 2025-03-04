import json
from .rpc import get_proxy, get_model, get_closing_control_data
import logging
from datetime import datetime
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import PosSession, Employee

logger = logging.getLogger(__name__)

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
        "cash_register_balance_start",
        "cash_register_balance_end",  # EFECTIVO ODOO (opening + cash sales)
    ]
    proxy = get_proxy()
    pos_session = get_model(ps_table, ps_filter, ps_fields, proxy=proxy)

    # ACCOUNT BANK STATEMENT
    abs_table = "account.bank.statement.line"
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
    cash_in_outs_total = 0
    if len(absl_sorted) > 0:
        for item in absl_sorted:
            if "Opening Balance difference for" in item["payment_ref"]:
                continue
            # for item in absl_sorted:
            cash_in_outs_total -= item["amount_residual"]

    # POS PAYMENT
    pp_table = "pos.payment"
    pp_filter = [[["session_id", "=", session_id]]]
    pp_fields = ["amount", "payment_method_id", "session_id"]
    pos_payments = get_model(pp_table, pp_filter, pp_fields, proxy=proxy)

    card = 0
    cash = cash_in_outs_total
    credit_note = 0
    # PAYMENT METHODS (16, 'Efectivo'), (8, 'YAPE'), (10, 'Nota de Credito')
    for payment in pos_payments:
        method_id = payment["payment_method_id"][0]
        amount = payment["amount"]

        if method_id in {1, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25, 27, 28}:
            cash += amount
        elif method_id in {2, 4, 6}:
            card += amount
        elif method_id in {10, 21, 26}:
            credit_note += amount

    opening = pos_session[0]["cash_register_balance_end"] - cash
    cash += opening

    # CHANGE TIMEZONE FORM UTC TO UTC-5
    start_at = pos_session[0]["start_at"]
    stop_at = pos_session[0]["stop_at"]

    result = {
        "pos_name": pos_session[0]["config_id"][1].split()[0],
        "session_id": pos_session[0]["id"],
        "session_name": pos_session[0]["display_name"],
        "balance_start": pos_session[0]["cash_register_balance_start"],
        "start_at": start_at,
        "stop_at": stop_at,
        "cash": cash,
        "card": card,
        "credit_note": credit_note,
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
    try:
        # Registrar el cuerpo de la solicitud
        logger.info(f"📥 Data recibida: {request.body}")

        data = json.loads(request.body)

        cashier_id = data["cashier"]["id"]
        manager_id = data["manager"]["id"]

        logger.info(f"📌 Buscando Cajero ID: {cashier_id}, Gerente ID: {manager_id}")

        # Verificar si existen los empleados
        cashier = Employee.objects.filter(id=cashier_id, is_used=True).first()
        manager = Employee.objects.filter(id=manager_id, is_used=True).first()

        if not cashier:
            logger.error(f"Cajero con ID {cashier_id} no encontrado o inactivo")
        if not manager:
            logger.error(f"Gerente con ID {manager_id} no encontrado o inactivo")

        if not cashier or not manager:
            return JsonResponse({"error": "Cajero o gerente inválido"}, status=400)

        # Mapear endState
        end_state_map = {"extra": "EX", "stable": "ST", "missing": "MS"}
        end_state = end_state_map.get(data["endState"]["state"], "ST")

        # Crear la sesión
        pos_session = PosSession.objects.create(
            pos_name=data["posName"],
            cashier=cashier,
            manager=manager,
            odoo_session_id=data["summary"]["sessionId"],
            odoo_cash=data["summary"]["odooCash"],
            odoo_card=data["summary"]["odooCard"],
            pos_cash=data["summary"]["posCash"],
            pos_card=data["summary"]["posCard"],
            profit_total=data["summary"]["profitTotal"],
            balance_start=data["summary"]["balanceStart"],
            balance_start_next_day=data["summary"]["balanceStartNextDay"],
            session_name=data["summary"]["sessionName"],
            start_at=data["summary"]["startAt"],
            stop_at=data["summary"]["stopAt"],
            end_state=end_state,
            end_state_amount=data["endState"]["amount"],
            end_state_note=data["endState"]["note"],
            json=json.dumps(data),  # Guardamos todo el JSON
        )

        logger.info(f"✅ Sesión creada con éxito: {pos_session.id}")
        return JsonResponse({"message": "Sesión guardada", "id": pos_session.id}, status=201)

    except json.JSONDecodeError:
        logger.error("❌ JSON inválido")
        return JsonResponse({"error": "JSON inválido"}, status=400)
    except KeyError as e:
        logger.error(f"❌ Falta el campo: {str(e)}")
        return JsonResponse({"error": f"Falta el campo: {str(e)}"}, status=400)

def employee(request, type):
    if type == Employee.CASHIER:
        cashiers = Employee.objects.filter(type=Employee.CASHIER, is_used=True).values(
            "id", "first_name", "last_name"
        )
        cashiers = list(cashiers)
        return JsonResponse(cashiers, safe=False)
    elif type == Employee.MANAGER:
        managers = Employee.objects.filter(type=Employee.MANAGER, is_used=True).values(
            "id", "first_name", "last_name"
        )
        managers = list(managers)
        return JsonResponse(managers, safe=False)
