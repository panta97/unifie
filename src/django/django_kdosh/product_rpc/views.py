import json

from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics


from .models import Report
from .serializers import ReportSerializer
from .refund import get_invoice, invoice_refund
from .credit import get_credit_note, pay_credit_note
from .attribute import get_attribute_vals as get_attr_vals, update_attribute_vals
from .reports.reports import (
    get_cpe_report,
    get_eq_report,
    get_fc_report,
    get_report_dynamic,
)
from .parser import transform_order_json, order_client_result
from .purchase_order import search_product_by_name, get_order_item, create_order
from .product import create_products_v2, get_weight_list
from .catalogs.cats import (
    update_product_catalogs,
    get_product_catalogs,
    get_order_catalogs,
    update_order_catalogs,
)
from .catalogs.cat_type import CatType


def get_catalogs(request, type):
    try:
        catalogs = {}
        if type == CatType.product.value:
            catalogs = get_product_catalogs()
        elif type == CatType.order.value:
            catalogs = get_order_catalogs()
        elif type == CatType.weight.value:
            catalogs = get_weight_list()
        return JsonResponse(catalogs)
    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def update_catalogs(request, type):
    try:
        if type == CatType.product.value:
            update_product_catalogs()
        elif type == CatType.order.value:
            update_order_catalogs()
    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)

    return JsonResponse(
        {"result": "SUCCESS", "message": "se actualizó la base de datos"}, status=200
    )


@csrf_exempt
@require_http_methods(["POST"])
def save_product(request):
    try:
        raw_json = json.loads(request.body)
        product_results = create_products_v2(raw_json, request.user)
    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)
    return JsonResponse({"result": "SUCCESS", "products": product_results}, status=200)


def search_product(request):
    try:
        products = search_product_by_name(request.GET.get("name"))
        response = JsonResponse({"result": "SUCCESS", "products": products}, status=200)
    except Exception as e:
        response = JsonResponse({"result": "ERROR", "message": str(e)}, status=400)
    return response


def get_purchase_order_product(request):
    try:
        order_item = get_order_item(
            request.GET.get("productId"), request.GET.get("type")
        )
        response = JsonResponse(
            {"result": "SUCCESS", "order_item": order_item}, status=200
        )
    except Exception as e:
        response = JsonResponse({"result": "ERROR", "message": str(e)}, status=400)
    return response


@csrf_exempt
@require_http_methods(["POST"])
def save_order(request):
    try:
        raw_json = json.loads(request.body)
        order_id = create_order(transform_order_json(raw_json), request.user)
        order_result = order_client_result(order_id)
        response = JsonResponse(
            {"result": "SUCCESS", "order": order_result}, status=200
        )
    except Exception as e:
        response = JsonResponse({"result": "ERROR", "message": str(e)}, status=400)
    return response


# ==================== PURCHASE ORDER EDITING ENDPOINTS ====================
from .purchase_order import (
    search_purchase_order_by_name,
    get_purchase_order_for_edit,
    update_purchase_order,
    get_pending_pickings_by_po_id,
    generate_lots_for_picking,
)


def get_pending_pickings_view(request, po_id):
    """GET /api/product-rpc/purchase_order/<po_id>/pickings"""
    try:
        pickings = get_pending_pickings_by_po_id(po_id)
        return JsonResponse({"result": "SUCCESS", "pickings": pickings}, status=200)
    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def generate_lots_view(request, picking_id):
    """POST /api/product-rpc/picking/<picking_id>/generate_lots"""
    try:
        body = json.loads(request.body)
        lots_config = body.get("lots_config", {})
        results = generate_lots_for_picking(picking_id, lots_config)
        return JsonResponse({"result": "SUCCESS", "results": results}, status=200)
    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)


def search_purchase_order_view(request, order_name):
    """GET /api/product-rpc/purchase_order/search/<order_name>"""
    try:
        order = search_purchase_order_by_name(order_name)
        if order:
            return JsonResponse({"result": "SUCCESS", "order": order}, status=200)
        else:
            return JsonResponse(
                {"result": "ERROR", "message": f"No se encontró la orden {order_name}"},
                status=404,
            )
    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)


@csrf_exempt
def purchase_order_dispatcher(request, po_id):
    if request.method == "GET":
        return get_purchase_order_view(request, po_id)
    elif request.method == "PUT":
        return update_purchase_order_view(request, po_id)
    else:
        return JsonResponse(
            {"result": "ERROR", "message": "Method not allowed"}, status=405
        )


def get_purchase_order_view(request, po_id):
    """GET /api/product-rpc/purchase_order/<po_id>"""
    try:
        order_data = get_purchase_order_for_edit(po_id)
        return JsonResponse({"result": "SUCCESS", "order": order_data}, status=200)
    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)


@csrf_exempt
def update_purchase_order_view(request, po_id):
    """PUT /api/product-rpc/purchase_order/<po_id>"""
    try:
        raw_json = json.loads(request.body)
        print(f"🔵 [UPDATE VIEW] Recibiendo actualización para PO {po_id}")
        print(f"📦 [UPDATE VIEW] Raw JSON recibido: {raw_json}")

        transformed_order = transform_order_json(raw_json)
        print(f"✅ [UPDATE VIEW] JSON transformado: {transformed_order}")
        print(
            f"📝 [UPDATE VIEW] Número de líneas de orden: {len(transformed_order['order_lines'])}"
        )

        order_id = update_purchase_order(po_id, transformed_order, request.user)
        print(f"✅ [UPDATE VIEW] Orden actualizada en Odoo: {order_id}")

        order_result = order_client_result(order_id)
        print(f"📤 [UPDATE VIEW] Resultado a enviar al frontend: {order_result}")

        return JsonResponse({"result": "SUCCESS", "order": order_result}, status=200)
    except Exception as e:
        print(f"❌ [UPDATE VIEW] Error: {str(e)}")
        import traceback

        traceback.print_exc()
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def get_report(request, type):
    try:
        body_json = json.loads(request.body)
        mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        if type == "cpe":
            workbook, filename = get_cpe_report(
                body_json["company_id"], body_json["date_from"], body_json["date_to"]
            )
            response = HttpResponse(workbook, content_type=mimetype)
            response["Content-Disposition"] = f"attachment; filename={filename}"
        elif type == "dk":
            response = JsonResponse(
                {"result": "ERROR", "message": "deprecated"}, status=400
            )
        elif type == "eq":
            workbook, filename = get_eq_report(
                body_json["store"], body_json["date_from"], body_json["date_to"]
            )
            response = HttpResponse(workbook, content_type=mimetype)
            response["Content-Disposition"] = f"attachment; filename={filename}"
        elif type == "fc":
            workbook, filename = get_fc_report(
                body_json["date_from"], body_json["date_to"]
            )
            response = HttpResponse(workbook, content_type=mimetype)
            response["Content-Disposition"] = f"attachment; filename={filename}"
        elif type == "dynamic":
            query_result = get_report_dynamic(body_json)
            response = JsonResponse(query_result, safe=False)

        return response
    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)


def get_attribute_vals(request):
    attribute_vals = get_attr_vals(request.GET.get("attrId"))
    response = JsonResponse(
        {"result": "SUCCESS", "attribute_vals": attribute_vals}, status=200
    )
    return response


@csrf_exempt
@require_http_methods(["POST"])
def sort_attribute_vals(request):
    raw_json = json.loads(request.body)
    update_attribute_vals(request.GET.get("attrId"), raw_json["new_attrs_sort"])
    response = JsonResponse(
        {"result": "SUCCESS", "message": "attributo actualizado"}, status=200
    )
    return response


def get_invoice_details(request):
    try:
        invoice_number = request.GET.get("number")
        invoice_details = get_invoice(invoice_number)

        if not invoice_details:
            raise Exception("Invoice not found")

        invoice_details["number"] = (
            invoice_details.get("number") or invoice_details.get("name") or "SIN_NUMERO"
        )

        return JsonResponse(
            {"result": "SUCCESS", "invoice_details": invoice_details}, status=200
        )

    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)


def get_credit_note_details(request):
    try:
        credit_note_number = request.GET.get("number")
        credit_note_details = get_credit_note(credit_note_number)

        if not credit_note_details:
            raise Exception("Credit Note not found")

        credit_note_details["number"] = (
            credit_note_details.get("number")
            or credit_note_details.get("name")
            or "SIN_NUMERO"
        )

        return JsonResponse(
            {"result": "SUCCESS", "credit_note_details": credit_note_details},
            status=200,
        )

    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def create_refund_invoice(request):
    try:
        raw_json = json.loads(request.body)
        # invoice_summaries = invoice_refund(
        #     raw_json["invoice_details"], raw_json["stock_location"]
        # )
        accion = raw_json.get("accion", None)
        if accion is None:
            return JsonResponse(
                {"result": "ERROR", "message": "Falta el parámetro 'accion'"},
                status=400,
            )
        invoice_summaries = invoice_refund(raw_json["invoice_details"], accion)
        response = JsonResponse(
            {
                "result": "SUCCESS",
                "refund_invoice": invoice_summaries["refund_invoice"],
                # "stock_move": invoice_summaries["stock_move"],
            },
            status=200,
        )
    except Exception as e:
        response = JsonResponse({"result": "ERROR", "message": str(e)}, status=400)
    return response


@csrf_exempt
@require_http_methods(["POST"])
def pay_credit_note_view(request):
    try:
        body_json = json.loads(request.body)
        credit_note_id = body_json.get("credit_note_id")

        if not credit_note_id:
            raise ValueError("No se proporcionó 'credit_note_id' en el body.")

        pay_result = pay_credit_note(credit_note_id)

        return JsonResponse(pay_result, status=200)

    except Exception as e:
        return JsonResponse({"result": "ERROR", "message": str(e)}, status=400)


class ReportList(generics.ListAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
