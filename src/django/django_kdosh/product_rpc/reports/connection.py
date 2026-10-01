import os
import pandas as pd

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    import psycopg as psycopg2
    from psycopg.rows import dict_row
    RealDictCursor = dict_row

# DB_CREDENTIALS = {
#      "PG_NAME_V17": "",
#      "PG_USER": "",
#      "PG_HOST": "",
#      "PG_PWD": "",
#  }


# def get_connstr(odoo_version):
#     db_name = None

#     if odoo_version == 11:
#         db_name = os.getenv("PG_NAME_V11", DB_CREDENTIALS.get("PG_NAME_V11"))
#     elif odoo_version == 15:
#         db_name = os.getenv("PG_NAME_V15", DB_CREDENTIALS.get("PG_NAME_V15"))
#     elif odoo_version == 17:
#         db_name = os.getenv("PG_NAME_V17", DB_CREDENTIALS.get("PG_NAME_V17"))

#     if not db_name:
#         raise ValueError(f"No database name found for Odoo v{odoo_version}")

#     connstr = f"dbname='{db_name}' user='{DB_CREDENTIALS['PG_USER']}' host='{DB_CREDENTIALS['PG_HOST']}' password='{DB_CREDENTIALS['PG_PWD']}'"
#     return connstr


def get_connstr(odoo_version):
    db_name = ""
    if odoo_version == 11:
        db_name = os.getenv("PG_NAME_V11")
    elif odoo_version == 15:
        db_name = os.getenv("PG_NAME_V15")
    elif odoo_version == 17:
        db_name = os.getenv("PG_NAME_V17")

    host = os.getenv("PG_HOST")
    user = os.getenv("PG_USER")
    pwd = os.getenv("PG_PWD") or os.getenv("PG_PASSWORD", "")
    port = os.getenv("PG_PORT")
    sslmode = os.getenv("PG_SSLMODE", "")

    # Fallback to DATABASE_URL if PG_HOST is not explicitly configured
    database_url = os.getenv("DATABASE_URL")
    if not host and database_url:
        try:
            import dj_database_url
            db_config = dj_database_url.parse(database_url)
            host = db_config.get("HOST", "")
            user = db_config.get("USER", "")
            pwd = db_config.get("PASSWORD", "")
            port = str(db_config.get("PORT", "5432"))
            if not db_name:
                db_name = db_config.get("NAME", "")
            if not sslmode and "OPTIONS" in db_config and "sslmode" in db_config["OPTIONS"]:
                sslmode = db_config["OPTIONS"]["sslmode"]
        except Exception:
            pass

    if not port:
        port = "5432"
    if not db_name:
        db_name = os.getenv("PG_NAME", os.getenv("PG_DATABASE", ""))

    # Auto-enable sslmode for DigitalOcean managed databases if not explicitly set
    if not sslmode and host and "ondigitalocean.com" in host:
        sslmode = "require"

    ssl_part = f" sslmode='{sslmode}'" if sslmode else ""
    connstr = f"dbname='{db_name}' user='{user}' host='{host}' password='{pwd}' port='{port}' connect_timeout='10'{ssl_part}"
    return connstr


def select_df(sql, odoo_version):
    conn = None
    try:
        connstr = get_connstr(odoo_version)
        conn = psycopg2.connect(connstr)
        df = pd.read_sql_query(sql, conn)
        return df
    except (Exception, psycopg2.Error) as error:
        print("Failed to get dataframe", error)
        raise Exception(f"Error de conexión a la base de datos: {error}")
    finally:
        if conn is not None:
            conn.close()


def select(sql, odoo_version, params=None):
    conn = None
    try:
        connstr = get_connstr(odoo_version)
        conn = psycopg2.connect(connstr)
        
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
        except TypeError:
            cursor = conn.cursor(row_factory=RealDictCursor)
        
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        results = cursor.fetchall()
        return results
    except (Exception, psycopg2.Error) as error:
        print("Failed to get dict list", error)
        raise Exception(f"Error de conexión a la base de datos: {error}")
    finally:
        if conn is not None:
            conn.close()