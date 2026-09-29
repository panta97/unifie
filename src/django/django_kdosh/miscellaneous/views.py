import json
import logging
from datetime import date

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .move_lines import move_lines as move_lines_func
from .sales import sales as sales_func
from .goals import goals as goals_func
from django.contrib.auth.decorators import login_required
from .constants import STORE_ABTAO, STORE_TINGO_MARIA
from .sales_analysis import analyze_sales, intent_from_question

logger = logging.getLogger(__name__)


def move_lines(request, invoice_number):
    try:
        move_lines_list = move_lines_func(invoice_number)
        response = JsonResponse(
            {"result": "SUCCESS", "move_lines": move_lines_list}, status=200
        )
    except Exception as e:
        response = JsonResponse({"result": "ERROR", "message": str(e)}, status=400)

    return response


# @login_required
def sales(request, date):
    try:
        # authorized_user_ids = [1]
        # if request.user.id not in authorized_user_ids:
        #     raise Exception("Unauthorized request")
        sales = sales_func(date)
        response = JsonResponse({"body": sales}, status=200)
    except Exception as e:
        response = JsonResponse({"result": "ERROR", "message": str(e)}, status=400)

    return response


@require_POST
def sales_analysis(request):
    try:
        payload = json.loads(request.body or "{}")
        selected_date = payload.get("date")
        if not isinstance(selected_date, str):
            raise ValueError("date is required and must use YYYY-MM-DD.")
        intent = payload.get("intent")
        store = payload.get("store")
        question = str(payload.get("question") or "").strip()
        if not intent and question:
            intent, question_store = intent_from_question(question)
            store = store or question_store
        result = analyze_sales(
            intent,
            date.fromisoformat(selected_date),
            period=payload.get("period", "day"),
            store=store,
            limit=payload.get("limit", 10),
        )
        return JsonResponse({"body": result}, status=200)
    except (json.JSONDecodeError, TypeError, ValueError) as error:
        return JsonResponse({"result": "ERROR", "message": str(error)}, status=400)
    except Exception:
        logger.exception("Sales analysis failed")
        return JsonResponse(
            {"result": "ERROR", "message": "No se pudo completar el análisis de ventas."},
            status=502,
        )


def goals_abtao(request, date):
    try:
        goals = goals_func(date, STORE_ABTAO)
        response = JsonResponse({"body": goals, "statusCode": 200}, status=200)
    except Exception as e:
        response = JsonResponse({"result": "ERROR", "message": str(e)}, status=400)

    return response


def goals_tingo(request, date):
    try:
        goals = goals_func(date, STORE_TINGO_MARIA)
        response = JsonResponse({"body": goals, "statusCode": 200}, status=200)
    except Exception as e:
        response = JsonResponse({"result": "ERROR", "message": str(e)}, status=400)

    return response
