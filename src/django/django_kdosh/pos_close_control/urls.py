from django.urls import path

from .views import get_pos_details, pos_persist, employee, PosCloseControlV2View

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
    # V2 API - single endpoint for both GET and POST
    path(
        "api/pos-close-control/v2/<int:session_id>",
        PosCloseControlV2View.as_view(),
        name="pos_close_control_v2",
    ),
]
