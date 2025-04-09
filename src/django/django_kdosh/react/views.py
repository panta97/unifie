import requests
from .shortcuts import render_react_app
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required


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
def miscellaneous_view(request):
    return render_react_app(request, "miscellaneous", "Otros")


def forward_static_files_view(request):
    response = requests.get(f"http://localhost:9000{request.path}")
    return HttpResponse(response, content_type=response.headers["Content-Type"])
