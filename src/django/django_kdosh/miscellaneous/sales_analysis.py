"""Application service for the limited k_sales analysis API."""

from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal

from .constants import STORE_ABTAO, STORE_TINGO_MARIA
from .openrouter import explain_analysis
from .sales_metrics import (
    ProductSalesMetric,
    SUPPORTED_STORES,
    get_product_ranking,
    get_store_totals,
)

SUPPORTED_INTENTS = {
    "top_products",
    "products_up",
    "products_down",
    "store_comparison",
    "sales_drivers",
}
SUPPORTED_PERIODS = {"day", "week", "month"}


def intent_from_question(question: str) -> tuple[str, str | None]:
    normalized = " ".join(question.lower().split())
    store = None
    if "abtao" in normalized:
        store = STORE_ABTAO
    elif "tingo maría" in normalized or "tingo maria" in normalized:
        store = STORE_TINGO_MARIA

    if any(word in normalized for word in ("comparar", "comparación", "tiendas", "sucursal")):
        return "store_comparison", None
    if any(word in normalized for word in ("subieron", "crecieron", "aumentaron", "mejoraron")):
        return "products_up", store
    if any(word in normalized for word in ("bajaron", "cayeron", "disminuyeron", "empeoraron")):
        return "products_down", store
    if any(word in normalized for word in ("explica", "explicar", "cambio", "variación", "variacion", "por qué", "por que")):
        return "sales_drivers", store
    return "top_products", store


def analyze_sales(
    intent: str,
    selected_date: date,
    *,
    period: str = "day",
    store: str | None = None,
    limit: int = 10,
) -> dict[str, object]:
    """Calculate an analysis without delegating arithmetic to an AI model."""
    _validate_request(intent, period, store, limit)
    current_start, current_end, previous_start, previous_end = _periods(selected_date, period)

    if intent == "top_products":
        metrics = get_product_ranking(current_start, current_end, store=store, limit=limit)
        return _response(
            intent,
            period,
            current_start,
            current_end,
            previous_start,
            previous_end,
            _product_rows(metrics),
            f"Estos son los productos con mayor venta en {store or 'Abtao y Tingo María'} entre {current_start} y {current_end}.",
            store=store,
        )

    if intent in {"products_up", "products_down", "sales_drivers"}:
        current = get_product_ranking(current_start, current_end, store=store, limit=100)
        previous = get_product_ranking(previous_start, previous_end, store=store, limit=100)
        rows = _product_changes(current, previous)
        if intent == "products_up":
            rows = [row for row in rows if row["difference"] > 0]
            rows.sort(key=lambda row: row["difference"], reverse=True)
            answer = "Estos son los productos que más crecieron frente al periodo anterior."
        elif intent == "products_down":
            rows = [row for row in rows if row["difference"] < 0]
            rows.sort(key=lambda row: row["difference"])
            answer = "Estos son los productos que más bajaron frente al periodo anterior."
        else:
            rows.sort(key=lambda row: abs(row["difference"]), reverse=True)
            answer = "Estos productos explican los principales cambios frente al periodo anterior."
        return _response(
            intent,
            period,
            current_start,
            current_end,
            previous_start,
            previous_end,
            _limit_change_rows(rows, limit),
            answer,
            store=store,
        )

    current_totals = _totals_by_store(get_store_totals(current_start, current_end))
    previous_totals = _totals_by_store(get_store_totals(previous_start, previous_end))
    rows = []
    for store_name in SUPPORTED_STORES:
        current_amount = current_totals[store_name]
        previous_amount = previous_totals[store_name]
        rows.append(
            {
                "store": store_name,
                "current": current_amount,
                "previous": previous_amount,
                "difference": current_amount - previous_amount,
                "percentage_change": _percentage_change(current_amount, previous_amount),
            }
        )
    rows.sort(key=lambda row: row["difference"], reverse=True)
    return _response(
        intent,
        period,
        current_start,
        current_end,
        previous_start,
        previous_end,
        _money_rows(rows),
        "Comparación de Abtao y Tingo María frente al periodo anterior.",
        store=None,
    )


def _periods(selected_date: date, period: str) -> tuple[date, date, date, date]:
    if period == "day":
        return selected_date, selected_date, selected_date - timedelta(days=7), selected_date - timedelta(days=7)
    if period == "week":
        current_start = selected_date - timedelta(days=selected_date.weekday())
        current_length = selected_date - current_start
        previous_end = selected_date - timedelta(days=7)
        return current_start, selected_date, previous_end - current_length, previous_end

    current_start = selected_date.replace(day=1)
    previous_month = current_start.month - 1 or 12
    previous_year = current_start.year - (1 if current_start.month == 1 else 0)
    previous_day = min(selected_date.day, monthrange(previous_year, previous_month)[1])
    previous_start = date(previous_year, previous_month, 1)
    return current_start, selected_date, previous_start, date(previous_year, previous_month, previous_day)


def _product_changes(
    current: list[ProductSalesMetric], previous: list[ProductSalesMetric]
) -> list[dict[str, object]]:
    current_by_id = {metric.product_id: metric for metric in current}
    previous_by_id = {metric.product_id: metric for metric in previous}
    rows = []
    for product_id in current_by_id.keys() | previous_by_id.keys():
        current_amount = current_by_id.get(product_id, _empty_metric(product_id)).subtotal_net
        previous_amount = previous_by_id.get(product_id, _empty_metric(product_id)).subtotal_net
        product = current_by_id.get(product_id) or previous_by_id[product_id]
        rows.append(
            {
                "product_id": product_id,
                "product_name": product.product_name,
                "current": current_amount,
                "previous": previous_amount,
                "difference": current_amount - previous_amount,
                "percentage_change": _percentage_change(current_amount, previous_amount),
                "quantity_net": product.quantity_net,
            }
        )
    return rows


def _product_rows(metrics: list[ProductSalesMetric]) -> list[dict[str, object]]:
    return [
        {
            "product_id": metric.product_id,
            "product_name": metric.product_name,
            "quantity_net": metric.quantity_net,
            "amount": metric.subtotal_net,
            "gross_amount": metric.subtotal_gross,
            "refund_amount": metric.subtotal_refunded,
        }
        for metric in metrics
    ]


def _response(
    intent: str,
    period: str,
    current_start: date,
    current_end: date,
    previous_start: date,
    previous_end: date,
    rows: list[dict[str, object]],
    answer: str,
    *,
    store: str | None = None,
) -> dict[str, object]:
    response = {
        "intent": intent,
        "store": store,
        "answer": answer,
        "period": {
            "current": {"start": current_start.isoformat(), "end": current_end.isoformat()},
            "previous": {"start": previous_start.isoformat(), "end": previous_end.isoformat()},
            "type": period,
        },
        "rows": [_serialize_row(row) for row in rows],
        "ai": {"status": "not_connected", "provider": None},
    }
    return explain_analysis(response)


def _serialize_row(row: dict[str, object]) -> dict[str, object]:
    serialized = {}
    for key, value in row.items():
        if isinstance(value, Decimal):
            serialized[key] = format(value, ".2f")
        else:
            serialized[key] = value
    return serialized


def _totals_by_store(rows: list[dict[str, object]]) -> dict[str, Decimal]:
    return {row["name"]: Decimal(str(row["amount"])) for row in rows}


def _money_rows(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    return rows


def _limit_change_rows(rows: list[dict[str, object]], limit: int) -> list[dict[str, object]]:
    return rows[:limit]


def _percentage_change(current: Decimal, previous: Decimal) -> Decimal | None:
    if previous == 0:
        return None
    return (current - previous) / previous * Decimal("100")


def _empty_metric(product_id: int) -> ProductSalesMetric:
    zero = Decimal("0")
    return ProductSalesMetric(product_id, "", zero, zero, zero, zero, zero, zero, zero, zero, zero)


def _validate_request(intent: str, period: str, store: str | None, limit: int) -> None:
    if intent not in SUPPORTED_INTENTS:
        raise ValueError(f"intent must be one of: {', '.join(sorted(SUPPORTED_INTENTS))}.")
    if period not in SUPPORTED_PERIODS:
        raise ValueError("period must be day, week or month.")
    if store not in (*SUPPORTED_STORES, None):
        raise ValueError(f"store must be {STORE_ABTAO}, {STORE_TINGO_MARIA} or omitted.")
    if limit <= 0 or limit > 100:
        raise ValueError("limit must be between 1 and 100.")
