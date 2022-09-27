
from .utils.sql import select, sql_to_dict
from .models import ProductAttributeValueOrder

def get_attribute_vals(attr_id):
    sql = """
    with attr as (
        select
            pav.id,
            pav.name,
            case when pavo.sort is null then pav.id
            else pavo.sort
            end as sort
        from rpc_product_attribute_value pav
        left join rpc_product_attribute_value_order pavo
            on pav.id = pavo.attr_val_id
        where pav.attribute_id = {}
    )
    select id,
        name,
        sort
    from attr
    order by attr.sort;
    """.format(str(attr_id))
    res = sql_to_dict(sql)
    return res

def update_attribute_vals(attr_id, new_attrs_sort):
    sql_attrs = """
        select pav.id, pavo.sort
        from rpc_product_attribute_value pav
        left join rpc_product_attribute_value_order pavo
            on pav.id = pavo.attr_val_id
        where pav.attribute_id = {}
    """.format(attr_id)
    attrs = select(sql_attrs)


    for attr in attrs:
        pav_id, pavo_sort = attr
        attr_sort = list(filter(lambda x: x['id'] == pav_id, new_attrs_sort))[0]
        if pavo_sort is None:
            ProductAttributeValueOrder.objects.create(attr_val_id=pav_id, sort=attr_sort['sort'])
        else:
            ProductAttributeValueOrder.objects.filter(attr_val_id=pav_id).update(sort=attr_sort['sort'])
