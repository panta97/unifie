from django.urls import path

from .views import move_lines, sales

urlpatterns = [
    path(
        "api/miscellaneous/move-lines/<str:invoice_number>",
        move_lines,
        name="move-lines",
    ),
    path(
        "api/miscellaneous/sales/<str:date>",
        sales,
        name="sales",
    ),
]
