import json

from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics


from .models import Report
from .serializers import ReportSerializer
from .refund import get_invoice, invoice_refund
from .credit import get_credit_note
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
        invoice_summaries = invoice_refund(raw_json["invoice_details"])
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


class ReportList(generics.ListAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
