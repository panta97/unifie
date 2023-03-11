import os
import pandas as pd
import psycopg2


def get_connstr(odoo_version):
    db_name = ""
    if odoo_version == 11:
        db_name = os.getenv("PG_NAME_V11")
    elif odoo_version == 15:
        db_name = os.getenv("PG_NAME_V15")
    connstr = "dbname='{}' user='{}' host='{}' password='{}'".format(
        db_name,
        os.getenv("PG_USER"),
        os.getenv("PG_HOST"),
        os.getenv("PG_PWD"),
    )
    return connstr


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
