import os
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor

# Hardcoded credentials
DB_CREDENTIALS = {
    "PG_NAME_V11": "kdosh_v11",  # Add the actual value for V11 if needed
    "PG_NAME_V15": "kdosh_v15",  # Add the actual value for V15 if needed
    "PG_NAME_V17": "kdosh_v17",
    "PG_USER": "postgres",
    "PG_HOST": "77.37.43.105",
    "PG_PWD": "asAS12!@",
}

def get_connstr(odoo_version):
    db_name = ""
    if odoo_version == 11:
        db_name = DB_CREDENTIALS["PG_NAME_V11"]
    elif odoo_version == 15:
        db_name = DB_CREDENTIALS["PG_NAME_V15"]
    elif odoo_version == 17:
        db_name = DB_CREDENTIALS["PG_NAME_V17"]

    if not db_name or not DB_CREDENTIALS["PG_USER"] or not DB_CREDENTIALS["PG_HOST"] or not DB_CREDENTIALS["PG_PWD"]:
        raise ValueError("One or more required credentials are not set.")

    connstr = "dbname='{}' user='{}' host='{}' password='{}'".format(
        db_name,
        DB_CREDENTIALS["PG_USER"],
        DB_CREDENTIALS["PG_HOST"],
        DB_CREDENTIALS["PG_PWD"],
    )
    return connstr

def select_df(sql, odoo_version):
    conn = None  # Initialize conn to None
    try:
        connstr = get_connstr(odoo_version)
        conn = psycopg2.connect(connstr)
        df = pd.read_sql_query(sql, conn)
        return df
    except (Exception, psycopg2.Error) as error:
        print("Failed to get dataframe", error)
    finally:
        if conn is not None:
            conn.close()

def select(sql, odoo_version, params=None):
    conn = None  # Initialize conn to None
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
        if conn is not None:
            conn.close()
