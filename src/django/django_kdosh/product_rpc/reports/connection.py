import os
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CREDENTIALS = {
     "PG_NAME_V17": "kdosh_v17",
     "PG_USER": "postgres",
     "PG_HOST": "77.37.43.105",
     "PG_PWD": "asAS12!@",
 }


def get_connstr(odoo_version):
    db_name = None

    if odoo_version == 11:
        db_name = os.getenv("PG_NAME_V11", DB_CREDENTIALS.get("PG_NAME_V11"))
    elif odoo_version == 15:
        db_name = os.getenv("PG_NAME_V15", DB_CREDENTIALS.get("PG_NAME_V15"))
    elif odoo_version == 17:
        db_name = os.getenv("PG_NAME_V17", DB_CREDENTIALS.get("PG_NAME_V17"))

    if not db_name:
        raise ValueError(f"No database name found for Odoo v{odoo_version}")

    connstr = f"dbname='{db_name}' user='{DB_CREDENTIALS['PG_USER']}' host='{DB_CREDENTIALS['PG_HOST']}' password='{DB_CREDENTIALS['PG_PWD']}'"
    return connstr

# def get_connstr(odoo_version):
#     db_name = ""
#     if odoo_version == 11:
#         db_name = os.getenv("PG_NAME_V11")
#     elif odoo_version == 15:
#         db_name = os.getenv("PG_NAME_V15")
#     elif odoo_version == 17:
#         db_name = os.getenv("PG_NAME_V17")
#     connstr = "dbname='{}' user='{}' host='{}' password='{}'".format(
#         db_name,
#         os.getenv("PG_USER"),
#         os.getenv("PG_HOST"),
#         os.getenv("PG_PWD"),
#     )
#     return connstr


def select_df(sql, odoo_version):
    try:
        connstr = get_connstr(odoo_version)
        conn = psycopg2.connect(connstr)
        df = pd.read_sql_query(sql, conn)
        return df
    except (Exception, psycopg2.Error) as error:
        print("Failed to get dataframe", error)
    finally:
        conn.close()


def select(sql, odoo_version, params=None):
    try:
        connstr = get_connstr(odoo_version)
        conn = psycopg2.connect(connstr)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        results = cursor.fetchall()
        return results
    except (Exception, psycopg2.Error) as error:
        print("Failed to get dict list", error)
    finally:
        conn.close()
