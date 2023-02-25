import json
import pandas as pd
from django.conf import settings
from xmlrpc import client as xmlrpclib


def keep_primitives(result_list):
    """
    rpc result comes in this form [
        { field_1: (int | string | list) }
    ]
    where field_1 may have a data type of list
    this function removes the list and keeps the first item
    """

    if len(result_list) == 0:
        return result_list
    should_remove_list = []
    for key, value in result_list[0].items():
        if isinstance(value, list):
            should_remove_list.append(True)
        else:
            should_remove_list.append(False)
    for result_item in result_list:
        for idx, (key, value) in enumerate(result_item.items()):
            if should_remove_list[idx]:
                result_item[key] = value[0]
    return result_list


def transform_list_of_dicts(result_list):
    """
    transform
    [
        {'field_1': 'one'},
        {'field_1': 'two'},
    ]
    to
    {
        'field_1': ['one', 'two']
    }
    """

    if len(result_list) == 0:
        return {}
    dict_of_lists = {}
    for key, value in result_list[0].items():
        dict_of_lists[key] = []
    for result_item in result_list:
        for key, value in result_item.items():
            dict_of_lists[key].append(value)
    return dict_of_lists


def get_proxy():
    return xmlrpclib.ServerProxy("{}/xmlrpc/2/object".format(settings.ODOO_URL))


def get_model(obj_table, filter, fields, type="regular", proxy=None):
    """
    types
        - regular
        - primitives
        - dict_of_lists
        - df
        - df_not_empty
    """
    if proxy is None:
        proxy = get_proxy()
    result_list = proxy.execute_kw(
        settings.ODOO_DB,
        int(settings.ODOO_UID),
        settings.ODOO_PWD,
        obj_table,
        "search_read",
        filter,
        {"fields": fields, "context": {"lang": "es_PE"}},
    )

    if type == "regular":
        return result_list
    elif type == "primitives":
        return keep_primitives(result_list)
    elif type == "dict_of_lists":
        result_primitives = keep_primitives(result_list)
        return transform_list_of_dicts(result_primitives)
    elif type == "df":
        result_primitives = keep_primitives(result_list)
        dict_of_lists = transform_list_of_dicts(result_primitives)
        return pd.DataFrame.from_dict(dict_of_lists)
    elif type == "df_not_empty":
        if len(result_list) > 0:
            result_primitives = keep_primitives(result_list)
            dict_of_lists = transform_list_of_dicts(result_primitives)
            return pd.DataFrame.from_dict(dict_of_lists)
        else:
            dict_of_lists = {"id": [0]}
            for field in fields:
                dict_of_lists[field] = [0]
            return pd.DataFrame.from_dict(dict_of_lists)


def execute_json_model(dict_model, uid, proxy=None):
    uid = str(uid)
    if proxy is None:
        proxy = get_proxy()
    if "kwargs" in dict_model["params"].keys():
        result_list = proxy.execute_kw(
            settings.ODOO_DB,
            uid,
            settings.ODOO_PWD,
            dict_model["params"]["model"],
            dict_model["params"]["method"],
            dict_model["params"]["args"],
            dict_model["params"]["kwargs"],
        )
    elif "domain" in dict_model["params"].keys():
        result_list = proxy.execute_kw(
            settings.ODOO_DB,
            uid,
            settings.ODOO_PWD,
            dict_model["params"]["model"],
            "search_read",
            [dict_model["params"]["domain"]],
            {
                "fields": dict_model["params"]["fields"],
                "context": dict_model["params"]["context"],
            },
        )
    else:
        result_list = proxy.execute_kw(
            settings.ODOO_DB,
            uid,
            settings.ODOO_PWD,
            dict_model["params"]["model"],
            dict_model["params"]["method"],
            dict_model["params"]["args"],
        )

    return result_list


def get_closing_control_data(pos_session_id, proxy=None):
    json_model = """
        {
            "id": 51,
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "args": [
                    [
                        3
                    ]
                ],
                "model": "pos.session",
                "method": "get_closing_control_data",
                "kwargs": {
                    "context": {
                        "lang": "es_PE",
                        "tz": "America/Lima",
                        "uid": 2,
                        "allowed_company_ids": [
                            1
                        ]
                    }
                }
            }
        }
    """

    dict_model = json.loads(json_model)
    # dict_model["params"]["args"][0][0] = pos_session_id
    # dict_model["params"]["kwargs"]["context"]["uid"] = int(settings.ODOO_UID)

    result_list = execute_json_model(dict_model, int(settings.ODOO_UID), proxy=proxy)
    return result_list
