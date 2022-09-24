from django.conf import settings
from .utils.sql import select

def transform_product_json(data):
    transf_obj = []
    for prod in data:
        default_code_map = []
        list_price_map = []
        for attr_dc in prod['attr_default_code']:
            default_code_map.append({
                'ids': [attr_val_id['id'] for attr_val_id in attr_dc['attr_val_ids']],
                'default_code': attr_dc['default_code'].strip(),
            })
        for attr_lp in prod['attr_list_price']:
            list_price_map.append({
                'ids': [attr_val_id['id'] for attr_val_id in attr_lp['attr_val_ids']],
                'list_price': attr_lp['list_price']
            })
        product = {
            'name' : prod['name'].strip(),
            'default_code' : prod['default_code'].strip(),
            'list_price' : prod['list_price'],
            'categ_id' : prod['category_brand_id'],
            'pos_categ_id' : prod['pos_categ_id'],
            'attribute_line_ids': [],
        }
        for attr in prod['attrs']:
            product['attribute_line_ids'].append({
                'attribute_id' : attr['attr']['id'],
                'value_ids': [attr_val['id'] for attr_val in attr['attr_vals']]
            })
        transf_obj.append({
            'product': product,
            'default_code_map': default_code_map,
            'list_price_map': list_price_map,
            'client_id': prod['id']
        })

    return transf_obj


def product_stats_get(product_tmpl_ids):
    sql = """
        select odoo_id, client_id
        from rpc_product_stats
        where odoo_id in ({});
    """.format(",".join(map(str,product_tmpl_ids)))
    res = select(sql)
    return res


def product_client_result(product_tmpl_ids):
    results = product_stats_get(product_tmpl_ids)
    product_results = []
    for result in results:
        # RESULT TUPLE (odoo_id, client_id)
        product_results.append({
            "odoo_id": result[0],
            "odoo_link": "{}/web#id={}&view_type=form&model=product.template&action=277&menu_id=145"
                .format(settings.ODOO_URL, result[0]),
            "client_id": result[1],
        })
    return product_results
