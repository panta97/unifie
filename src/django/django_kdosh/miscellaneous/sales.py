from datetime import date

from .sales_metrics import get_store_totals


def sales(date_string):
    selected_date = date.fromisoformat(date_string)
    return get_store_totals(selected_date, selected_date)
