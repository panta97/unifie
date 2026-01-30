from django.urls import path


from .views import (
    update_catalogs,
    get_catalogs,
    save_product,
    search_product,
    get_purchase_order_product,
    save_order,
    get_report,
    get_attribute_vals,
    sort_attribute_vals,
    get_invoice_details,
    get_credit_note_details,
    create_refund_invoice,
    pay_credit_note_view,
    ReportList,
    # Purchase order editing
    search_purchase_order_view,
    get_purchase_order_view,
    update_purchase_order_view,
    purchase_order_dispatcher,
    get_pending_pickings_view,
    generate_lots_view,
)


urlpatterns = [
    path("catalogs/<int:type>", get_catalogs, name="get_catalogs"),
    path("update/cats/<int:type>", update_catalogs, name="update_catalogs"),
    path("product_product", save_product, name="save_product"),
    path("purchase_order/product", search_product, name="search_product"),
    path(
        "purchase_order/order_item",
        get_purchase_order_product,
        name="get_purchase_order_product",
    ),
    path("purchase_order", save_order, name="save_order"),
    # Purchase order editing endpoints
    path(
        "purchase_order/search/<str:order_name>",
        search_purchase_order_view,
        name="search_purchase_order",
    ),
    path(
        "purchase_order/<int:po_id>",
        purchase_order_dispatcher,
        name="purchase_order_detail",
    ),
    path(
        "purchase_order/<int:po_id>/pickings",
        get_pending_pickings_view,
        name="get_pending_pickings",
    ),
    path(
        "picking/<int:picking_id>/generate_lots",
        generate_lots_view,
        name="generate_lots",
    ),
    path("report/<str:type>", get_report, name="get_report"),
    path("attribute/list", get_attribute_vals, name="get_attribute_vals"),
    path("attribute/sort", sort_attribute_vals, name="sort_attribute_vals"),
    path("refund/invoice", get_invoice_details, name="get_invoice_details"),
    path(
        "credit-note/invoice", get_credit_note_details, name="get_credit_note_details"
    ),
    path("refund/create", create_refund_invoice, name="create_refund_invoice"),
    path("credit-note/pay", pay_credit_note_view, name="pay_credit_note"),
    path("reports", ReportList.as_view(), name="reports"),
]
