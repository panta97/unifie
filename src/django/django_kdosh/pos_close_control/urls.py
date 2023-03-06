from django.urls import path

from .views import get_pos_details, pos_persist, employee

urlpatterns = [
    path(
        "api/pos-close-control/get-pos-details/<int:session_id>",
        get_pos_details,
        name="get_pos_details",
    ),
    path(
        "api/pos-close-control/pos-persists/",
        pos_persist,
        name="pos_persist",
    ),
    path("api/pos-close-control/employee/<str:type>", employee, name="employee"),
]
