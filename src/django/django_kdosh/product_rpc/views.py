import json

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from .purchase_order import search_product_by_name, get_order_item
from .product import create_products_v2
from .catalogs.cats import update_product_catalogs, get_product_catalogs, get_order_catalogs, update_order_catalogs
from .catalogs.cat_type import CatType
from django.views.decorators.csrf import csrf_exempt



def get_catalogs(request, type):
    try:
        catalogs = {}
        if type == CatType.product.value:
            catalogs = get_product_catalogs()
        elif type == CatType.order.value:
            catalogs = get_order_catalogs()
        return JsonResponse(catalogs)
    except Exception as e:
        return JsonResponse({'result': 'ERROR', 'message' : str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def update_catalogs(request, type):
    try:
        if type == CatType.product.value:
            update_product_catalogs()
        elif type == CatType.order.value:
            update_order_catalogs()
    except Exception as e:
        return JsonResponse({'result': 'ERROR', 'message' : str(e)}, status=400)

    return JsonResponse({'result': 'SUCCESS', 'message' : 'se actualizó la base de datos'}, status=200)


@csrf_exempt
@require_http_methods(["POST"])
def save_product(request):
    try:
        raw_json = json.loads(request.body)
        product_results = create_products_v2(raw_json)
    except Exception as e:
        return JsonResponse({'result': 'ERROR', 'message' : str(e)}, status=400)
    return JsonResponse({'result': 'SUCCESS', 'products' : product_results}, status=200)


def search_product(request):
    try:
        products = search_product_by_name(request.GET.get('name'))
        response = JsonResponse({'result': 'SUCCESS', 'products': products}, status=200)
    except Exception as e:
        response = JsonResponse({'result': 'ERROR', 'message' : str(e)}, status=400)
    return response


def get_purchase_order_product(request):
    try:
        order_item = get_order_item(request.GET.get('productId'), request.GET.get('type'))
        response = JsonResponse({'result': 'SUCCESS', 'order_item': order_item}, status=200)
    except Exception as e:
        response = JsonResponse({'result': 'ERROR', 'message' : str(e)}, status=400)
    return response
