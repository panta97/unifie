from django.urls import path

from .views import move_lines

urlpatterns = [
    path(
        "api/miscellaneous/move-lines/<str:invoice_number>",
        move_lines,
        name="move-lines",
    )
]
