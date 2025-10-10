from django.urls import path
from .views import get_pricelists, search_products, save_to_pricelist

urlpatterns = [
    path("pricelists/", get_pricelists, name="get_pricelists"),
    path("products/search/", search_products, name="search_products"),
    path("save/", save_to_pricelist, name="save_to_pricelist"),
]
