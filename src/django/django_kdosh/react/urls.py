from django.urls import path, re_path
from django.conf import settings

from .views import (
    barcode_view,
    product_rpc_view,
    purchase_order_sheet_view,
    stock_picking_sheet_view,
    k_sales_view,
    k_goals_abtao_view,
    k_goals_tingo_view,
    forward_static_files_view,
    pos_close_control_view,
    pos_close_control_admin_view,
    generator_qr_code_view,
    reports_credit_note_view,
    prices_list_view,
    pos_orders_api,
    miscellaneous_view,
)

urlpatterns = [
    path("apps/barcode", barcode_view, name="barcode"),
    path(
        "apps/purchase-order-sheet",
        purchase_order_sheet_view,
        name="purchase_order_sheet",
    ),
    path(
        "apps/stock-picking-sheet",
        stock_picking_sheet_view,
        name="stock_picking_sheet",
    ),
    path("apps/k-sales/ef93d12", k_sales_view, name="k_sales"),
    path("apps/k-goals/abtao/eb38723", k_goals_abtao_view, name="k_goals_abtao"),
    path("apps/k-goals/tingo/87a4af9", k_goals_tingo_view, name="k_goals_tingo"),
    re_path(
        r"^apps/product-rpc/(|product-product|purchase-order|reports|refunds)",
        product_rpc_view,
        name="product_rpc",
    ),
    re_path(
        r"^apps/pos-close-control/(|cash|card|balance-start|discount-invoices|cash-unlocked)",
        pos_close_control_view,
        name="pos_close_control",
    ),
    re_path(
        r"^apps/pos-close-control-admin/(|discount)/?$",
        pos_close_control_admin_view,
        name="pos_close_control_admin",
    ),
    path("apps/generator-qr-code", generator_qr_code_view, name="generator_qr_code"),
    path("apps/reports-credit-note", reports_credit_note_view, name="reports_credit_note"),
    path("apps/prices-list", prices_list_view, name="price_list"),
    path("api/pos-orders", pos_orders_api, name="pos_orders_api"),
    path("apps/miscellaneous", miscellaneous_view, name="miscellaneous"),
    (
        re_path(
            r"^react-static/web/.*",
            forward_static_files_view,
            name="forward_static_files_view",
        )
        if settings.DEBUG == True
        else None
    ),
]
