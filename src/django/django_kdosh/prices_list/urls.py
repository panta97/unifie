from django.urls import path
from . import views

urlpatterns = [
    path('pricelists/', views.get_pricelists, name='get_pricelists'),
    path('products/search/', views.search_products, name='search_products'),
    path('categories/', views.get_categories, name='get_categories'),
    path('products/by-category/', views.search_products_by_category, name='search_by_category'),
    path('save/', views.save_to_pricelist, name='save_to_pricelist'),
]
