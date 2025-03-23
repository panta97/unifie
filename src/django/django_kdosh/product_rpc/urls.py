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
    ReportList,
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
    path("report/<str:type>", get_report, name="get_report"),
    path("attribute/list", get_attribute_vals, name="get_attribute_vals"),
    path("attribute/sort", sort_attribute_vals, name="sort_attribute_vals"),
    path("refund/invoice", get_invoice_details, name="get_invoice_details"),
    path("credit-note/invoice", get_credit_note_details, name="get_credit_note_details"),
    path("refund/create", create_refund_invoice, name="create_refund_invoice"),
    path("reports", ReportList.as_view(), name="reports"),
]
