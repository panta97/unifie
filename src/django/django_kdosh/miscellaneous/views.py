from django.http import JsonResponse
from .move_lines import move_lines as move_lines_func


def move_lines(request, invoice_number):
    try:
        move_lines_list = move_lines_func(invoice_number)
        response = JsonResponse(
            {"result": "SUCCESS", "move_lines": move_lines_list}, status=200
        )
    except Exception as e:
        response = JsonResponse({"result": "ERROR", "message": str(e)}, status=400)

    return response
