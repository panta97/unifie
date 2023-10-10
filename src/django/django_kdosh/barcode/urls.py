from django.urls import path

from .views import (
    get_product_product,
    get_product_template,
    get_purchase_order,
    get_purchase_order_sheet,
    get_stock_picking,
)

urlpatterns = [
    path(
        "api/barcode/product-product/<int:pp_id>",
        get_product_product,
        name="get_product_product",
    ),
    path(
        "api/barcode/product-template/<int:pt_id>",
        get_product_template,
        name="get_product_template",
    ),
    path(
        "api/barcode/purchase-order/<int:po_id>",
        get_purchase_order,
        name="get_purchase_order",
    ),
    path(
        "api/barcode/purchase-order-sheet/<int:po_id>",
        get_purchase_order_sheet,
        name="get_purchase_order_sheet",
    ),
    path(
        "api/barcode/stock-picking/<int:sp_id>",
        get_stock_picking,
        name="get_stock_picking",
    ),
]
