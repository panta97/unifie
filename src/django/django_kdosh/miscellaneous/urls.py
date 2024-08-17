from django.urls import path

from .views import move_lines, sales, goals_abtao, goals_tingo

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
    path("api/miscellaneous/goals/abtao/<str:date>", goals_abtao, name="goals_abtao"),
    path("api/miscellaneous/goals/tingo/<str:date>", goals_tingo, name="goals_tingo"),
]
