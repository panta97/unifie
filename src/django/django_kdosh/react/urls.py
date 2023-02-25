from django.urls import path, re_path
from django.conf import settings

from .views import (
    barcode_view,
    product_rpc_view,
    purchase_order_sheet_view,
    k_sales_view,
    forward_static_files_view,
    pos_close_control_view,
)

urlpatterns = [
    path("apps/barcode", barcode_view, name="barcode"),
    path(
        "apps/purchase-order-sheet",
        purchase_order_sheet_view,
        name="purchase_order_sheet",
    ),
    path("apps/k-sales", k_sales_view, name="k_sales"),
    re_path(
        r"^apps/product-rpc/(|product-product|purchase-order|reports|refunds)",
        product_rpc_view,
        name="product_rpc",
    ),
    re_path(
        r"^apps/pos-close-control/(|cash|card|balance-start|discount-invoices|discount|cash-unlocked)",
        pos_close_control_view,
        name="pos_close_control",
    ),
    re_path(
        r"^react-static/web/.*",
        forward_static_files_view,
        name="forward_static_files_view",
    )
    if settings.DEBUG == True
    else None,
]
