from django.db import connection

def select(sql):
    with connection.cursor() as cursor:
        cursor.execute(sql)
        return cursor.fetchall()
