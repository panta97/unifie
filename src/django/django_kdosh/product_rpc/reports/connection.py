import os
import pandas as pd
import psycopg2

connstr = "dbname='{}' user='{}' host='{}' password='{}'" \
    .format(
        os.getenv("PG_NAME"),
        os.getenv("PG_USER"),
        os.getenv("PG_HOST"),
        os.getenv("PG_PWD")
    )

def select_df(sql):
    try:
        conn = psycopg2.connect(connstr)
        df = pd.read_sql_query(sql, conn)
        return df
    except (Exception, psycopg2.Error) as error:
        print("Failed to get dataframe", error)
    finally:
        conn.close()
