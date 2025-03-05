from django.http import JsonResponse
from .move_lines import move_lines as move_lines_func
from .sales import sales as sales_func
from .goals import goals as goals_func
from django.contrib.auth.decorators import login_required
from .constants import STORE_ABTAO, STORE_TINGO_MARIA


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
