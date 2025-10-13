import json
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from .odoo_service import OdooService


@login_required
@require_http_methods(["GET"])
def get_pricelists(request):
    try:
        odoo = OdooService()
        price_lists = odoo.get_price_lists()

        return JsonResponse({"success": True, "data": price_lists})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
def search_products(request):
    reference = request.GET.get("reference", "")

    if not reference:
        return JsonResponse(
            {"success": False, "error": "Reference parameter is required"}, status=400
        )

    try:
        odoo = OdooService()
        products = odoo.search_products_by_reference(reference)

        return JsonResponse({"success": True, "data": products, "count": len(products)})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@require_http_methods(["GET"])
def get_categories(request):
    try:
        odoo_service = OdooService()
        categories = odoo_service.get_categories()

        return JsonResponse({"success": True, "data": categories})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@require_http_methods(["GET"])
def search_products_by_category(request):
    try:
        category_id = request.GET.get("category_id")

        if not category_id:
            return JsonResponse(
                {"success": False, "error": "category_id es requerido"}, status=400
            )

        odoo_service = OdooService()
        products = odoo_service.search_products_by_category(category_id)

        return JsonResponse({"success": True, "data": products})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
@ensure_csrf_cookie
def save_to_pricelist(request):
    try:
        data = json.loads(request.body)
        pricelist_id = data.get("pricelistId")
        products = data.get("products", [])
        apply_mode = data.get("applyMode", "product")

        if not pricelist_id:
            return JsonResponse(
                {"success": False, "error": "Pricelist ID is required"}, status=400
            )

        if not products:
            return JsonResponse(
                {"success": False, "error": "No products provided"}, status=400
            )

        products_with_discount = [p for p in products if p.get("discount", 0) > 0]

        if not products_with_discount:
            return JsonResponse(
                {"success": False, "error": "No products with discount found"},
                status=400,
            )

        odoo = OdooService()
        result = odoo.update_pricelist_items(
            pricelist_id, products_with_discount, apply_mode
        )

        return JsonResponse(
            {
                "success": True,
                "message": f'Creados: {result["created"]}, Actualizados: {result["updated"]}',
                "created": result["created"],
                "updated": result["updated"],
                "total": len(products_with_discount),
            }
        )
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
