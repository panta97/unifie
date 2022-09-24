from .cat_type import CatType

def get_cats(type):
    if type == CatType.product.value:
        return cats.get_product_catalogs()
    elif type == CatType.order.value:
        return cats.get_order_catalogs()
