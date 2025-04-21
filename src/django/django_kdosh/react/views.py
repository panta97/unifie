import requests, json
from .shortcuts import render_react_app
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from .models import PosExternalLog
from django.views.decorators.csrf import csrf_exempt


@login_required
def barcode_view(request):
    return render_react_app(request, "barcode", "Barcode")


@login_required
def purchase_order_sheet_view(request):
    return render_react_app(
        request, "purchase_order_sheet", "Purchase Order", hide_in_print_mode=False
    )


@login_required
def stock_picking_sheet_view(request):
    return render_react_app(
        request, "stock_picking_sheet", "Stock Picking", hide_in_print_mode=False
    )


# TODO: find a way to keep this link secure but don't require a login
# @login_required
def k_sales_view(request):
    return render_react_app(request, "k_sales", "Ventas")


def k_goals_abtao_view(request):
    return render_react_app(request, "k_abtao_goals", "Abtao Metas")


def k_goals_tingo_view(request):
    return render_react_app(request, "k_tingo_goals", "TingoMetas")


@login_required
def product_rpc_view(request, param):
    # don't know what the second argument holds
    return render_react_app(request, "product_rpc", "Almacen")


@login_required
def pos_close_control_view(request, param):
    return render_react_app(request, "pos_close_control", "Caja Cuadre")


@login_required
def generator_qr_code_view(request):
    return render_react_app(request, "generator_qr_code", "Generador QR")


@login_required
def reports_credit_note_view(request):
    return render_react_app(request, "reports_credit_note", "Reportes Nota de Crédito")


@csrf_exempt
def pos_orders_api(request):
    if request.method == "OPTIONS":
        response = JsonResponse({}, status=200)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "X-Secret-Key, Content-Type"
        return response

    if request.method == "POST":
        clave_recibida = request.headers.get("X-Secret-Key")

        if clave_recibida != "200420251140pdvgeneral":
            return JsonResponse({"error": "Clave inválida"}, status=403)

        try:
            data = json.loads(request.body)

            log = PosExternalLog.objects.create(
                order_data=json.dumps(data),
                user_name=data.get("user_name"),
                config_name=data.get("config_name"),
                status="success",
                response="Datos recibidos correctamente",
            )

            return JsonResponse({"status": "success", "log_id": log.id})

        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    elif request.method == "GET":
        try:
            logs = PosExternalLog.objects.filter(
                status="success", order_data__contains='"is_credit_note": true'
            ).order_by("-timestamp")[:100]

            orders = []
            for log in logs:
                try:
                    order_data = json.loads(log.order_data)
                    orders.append(
                        {
                            "orden_pos": order_data.get("pos_order_id"),
                            "user_name": order_data.get("user_name"),
                            "config_name": order_data.get("config_name"),
                            "nota_credito_id": order_data.get("credit_note_id"),
                            "total": order_data.get("total"),
                            "fecha": order_data.get("timestamp"),
                            "metodos_pago": [
                                f"{p['method']}: S/ {p['amount']}"
                                for p in order_data.get("payments", [])
                                if p.get("is_credit_note")
                            ],
                        }
                    )
                except json.JSONDecodeError:
                    continue

            return JsonResponse({"orders": orders}, safe=False)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Método no permitido"}, status=405)


@login_required
def miscellaneous_view(request):
    return render_react_app(request, "miscellaneous", "Otros")


def forward_static_files_view(request):
    response = requests.get(f"http://localhost:9000{request.path}")
    return HttpResponse(response, content_type=response.headers["Content-Type"])
