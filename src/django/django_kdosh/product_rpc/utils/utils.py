import os
import json
import time
import datetime
import pandas as pd
from collections.abc import Mapping, Iterable
from decimal import Decimal
from django.conf import settings

# from core.connection.sqlite import select

def rpc_read_to_df(list):
    r_dict = {}
    for key in list[0]:
        r_dict[key] = []

    for item in list:
        for key in item:
            if isinstance(item[key], type(list)):
                r_dict[key].append(item[key][0])
            else:
                r_dict[key].append(item[key])

    df = pd.DataFrame(data=r_dict)

    # for key in list[0]:
    #     if isinstance(list[0][key], type(list)):
    #         # [id, name]
    #         # get the id only
    #         df[key] = df[key][0]

    return df

def rpc_read_to_dict(list):
    r_dict = {}
    for key in list[0]:
        r_dict[key] = []

    for item in list:
        for key in item:
            if isinstance(item[key], type(list)):
                r_dict[key].append(item[key][0])
            else:
                r_dict[key].append(item[key])

    return r_dict

def rpc_read_to_tuple(list):
    list_tpl = []
    for item in list:
        for val in item.values:

            pass
    pass

def sql_insert_statement(df, table):
    sql_texts = []
    for index, row in df.iterrows():

        values = ''
        for val in row.values:
            if val is None or val == False:
                values += 'NULL,'
            elif isinstance(val, str):
                values += "'" + str(val) + "',"
            else:
                values += str(val) + ','
        values = values[0:len(values)-1]

        sql_texts.append('('+ values + '),')

    sql = ' ('+ str(', '.join(df.columns))+ ') VALUES ' + ''.join(sql_texts)
    sql = sql[0:len(sql)-1] + ';'
    sql = 'INSERT INTO ' + table + sql
    return sql

def get_user_password(id):
    # sql = """
    #     select password
    #     from user
    #     where id = {}
    # """.format(id)
    # result = select(sql)

    # if len(result) == 1:
    #     return result[0][0]
    # else:
    #     raise Exception('user password not found')

    return settings.ODOO_PWD


def tuple_to_dictionary(tuple_item, mapper):
    dict_item = {}
    for map in mapper:
        dict_item[map["field"]] = tuple_item[map["i"]]
    return dict_item

def get_epoch_time():
    return int(str(time.time())[0:14].replace('.', ''))

def delete_files(path):
    today = datetime.datetime.today()
    for root,directories,files in os.walk(os.path.join(os.getcwd(), path),topdown=False):
        for name in files:
            t = os.stat(os.path.join(root, name))[8]
            filetime = datetime.datetime.fromtimestamp(t) - today
            if filetime.days <= -2:
                os.remove(os.path.join(root, name))

class DecimalEncoder(json.JSONEncoder):
    def encode(self, obj):
        if isinstance(obj, Mapping):
            return '{' + ', '.join(f'{self.encode(k)}: {self.encode(v)}' for (k, v) in obj.items()) + '}'
        if isinstance(obj, Iterable) and (not isinstance(obj, str)):
            return '[' + ', '.join(map(self.encode, obj)) + ']'
        if isinstance(obj, Decimal):
            return f'{obj.normalize():f}'  # using normalize() gets rid of trailing 0s, using ':f' prevents scientific notation
        return super().encode(obj)

def get_invoice_datetime_format(create_date):
    date_time_obj = datetime.datetime.strptime(create_date, "%Y-%m-%d %H:%M:%S")
    date_time_obj = date_time_obj - datetime.timedelta(hours=5)
    return date_time_obj.strftime("%d/%m/%Y %H:%M")
