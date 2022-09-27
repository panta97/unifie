from django.db import connection

def select(sql):
    with connection.cursor() as cursor:
        cursor.execute(sql)
        return cursor.fetchall()


def sql_to_dict(sql):
    with connection.cursor() as cursor:
        cursor.execute(sql)
        rows = cursor.fetchall()
        dict_list = [
                dict((cursor.description[i][0], value) for i, value in enumerate(row))
                for row in rows
            ]
        return dict_list
