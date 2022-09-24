from django.urls import path


from .views import update_catalogs, get_catalogs, save_product, search_product, get_purchase_order_product

urlpatterns = [
    path('api/product-rpc/catalogs/<int:type>', get_catalogs, name='get_catalogs'),
    path('api/product-rpc/update/cats/<int:type>', update_catalogs, name='update_catalogs'),
    path('api/product-rpc/product_product', save_product, name='save_product'),
    path('api/product-rpc/purchase_order/product', search_product, name='search_product'),
    path('api/product-rpc/purchase_order/order_item', get_purchase_order_product, name='get_purchase_order_product'),
]
