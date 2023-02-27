import requests
from .shortcuts import render_react_app
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required


@login_required
def barcode_view(request):
    return render_react_app(request, "barcode", "Barcode")


@login_required
def purchase_order_sheet_view(request):
    return render_react_app(request, "purchase_order_sheet", "Purchase Order")


@login_required
def k_sales_view(request):
    return render_react_app(request, "k_sales", "Sales")


@login_required
def product_rpc_view(request, param):
    # don't know what the second argument holds
    return render_react_app(request, "product_rpc", "Almacen")


@login_required
def pos_close_control_view(request, param):
    # don't know what the second argument holds
    return render_react_app(request, "pos_close_control", "Caja Cuadre")


def forward_static_files_view(request):
    response = requests.get(f"http://localhost:9000{request.path}")
    return HttpResponse(response, content_type=response.headers["Content-Type"])
