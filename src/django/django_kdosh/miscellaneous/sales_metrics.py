"""Deterministic sales metrics used by k_sales and the future assistant."""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from django.conf import settings
from kdosh_odoo import OdooClient, OdooConfig, SalesLine
from product_rpc.utils.invoices import get_series_list

from .constants import STORE_ABTAO, STORE_TINGO_MARIA

STORE_CODES = {
    STORE_ABTAO: "ab-store",
    STORE_TINGO_MARIA: "tg-store",
}
STORE_JOURNAL_IDS = {
    STORE_ABTAO: {37, 95},
    STORE_TINGO_MARIA: {39, 97},
}
SUPPORTED_STORES = tuple(STORE_CODES)
SERIES_STORE_KEYS = {
    STORE_ABTAO: "abtao",
    STORE_TINGO_MARIA: "tingo_maria",
}
_SERIES_PATTERN = re.compile(r"\b([BF][A0]\d{2})\b")


@dataclass(frozen=True)
class ProductSalesMetric:
    """Net product performance while preserving gross and refund amounts."""

    product_id: int
    product_name: str
    quantity_gross: Decimal
    quantity_refunded: Decimal
    quantity_net: Decimal
    subtotal_gross: Decimal
    subtotal_refunded: Decimal
    subtotal_net: Decimal
    total_gross: Decimal
    total_refunded: Decimal
    total_net: Decimal


def get_odoo_client() -> OdooClient:
    """Build the read client from Django settings for one request operation."""
    return OdooClient(
        OdooConfig(
            url=settings.ODOO_URL,
            database=settings.ODOO_DB,
            username=settings.ODOO_USERNAME,
            password=settings.ODOO_PWD,
        )
    )


def get_sales_lines(start_date: date, end_date: date) -> tuple[SalesLine, ...]:
    """Read only lines belonging to Abtao or Tingo María."""
    _validate_period(start_date, end_date)
    lines = get_odoo_client().sales.lines(start_date, end_date)
    return tuple(line for line in lines if store_for_line(line) is not None)


def store_for_line(line: SalesLine) -> str | None:
    """Resolve a store from the invoice journal series explicitly."""
    for store, journal_ids in STORE_JOURNAL_IDS.items():
        if line.journal_id in journal_ids:
            return store
    match = _SERIES_PATTERN.search(line.journal_name or "")
    if not match:
        return None
    series = match.group(1)
    year = str(line.invoice_date.year)
    for store in SUPPORTED_STORES:
        if series in get_series_list(SERIES_STORE_KEYS[store], year):
            return store
    return None


def get_store_totals(start_date: date, end_date: date) -> list[dict[str, object]]:
    """Aggregate posted product-line totals by the two active stores."""
    totals = {store: Decimal("0") for store in SUPPORTED_STORES}
    for line in get_sales_lines(start_date, end_date):
        store = store_for_line(line)
        if store:
            totals[store] += line.total
    return [
        {"code": STORE_CODES[store], "name": store, "amount": totals[store]}
        for store in SUPPORTED_STORES
    ]


def get_product_ranking(
    start_date: date,
    end_date: date,
    *,
    store: str | None = None,
    limit: int = 10,
) -> list[ProductSalesMetric]:
    """Return variant-level ranking ordered by net subtotal, highest first."""
    _validate_period(start_date, end_date)
    if store is not None and store not in SUPPORTED_STORES:
        raise ValueError("store must be Abtao or Tingo María.")
    if limit <= 0 or limit > 100:
        raise ValueError("limit must be between 1 and 100.")

    values: dict[int, dict[str, Decimal | str]] = defaultdict(
        lambda: {
            "product_name": "",
            "quantity_gross": Decimal("0"),
            "quantity_refunded": Decimal("0"),
            "subtotal_gross": Decimal("0"),
            "subtotal_refunded": Decimal("0"),
            "total_gross": Decimal("0"),
            "total_refunded": Decimal("0"),
        }
    )
    for line in get_sales_lines(start_date, end_date):
        line_store = store_for_line(line)
        if store and line_store != store:
            continue
        # A negative product line on a normal invoice is usually a global
        # coupon/adjustment, not a product return. Credit notes remain part of
        # the ranking and are handled in the refund bucket below.
        if line.move_type == "out_invoice" and line.subtotal <= 0:
            continue
        item = values[line.product_id]
        item["product_name"] = line.product_name
        bucket = "refunded" if line.move_type == "out_refund" else "gross"
        item[f"quantity_{bucket}"] += abs(line.quantity)
        item[f"subtotal_{bucket}"] += abs(line.subtotal)
        item[f"total_{bucket}"] += abs(line.total)

    metrics = []
    for product_id, item in values.items():
        quantity_gross = item["quantity_gross"]
        quantity_refunded = item["quantity_refunded"]
        subtotal_gross = item["subtotal_gross"]
        subtotal_refunded = item["subtotal_refunded"]
        total_gross = item["total_gross"]
        total_refunded = item["total_refunded"]
        metrics.append(
            ProductSalesMetric(
                product_id=product_id,
                product_name=item["product_name"],
                quantity_gross=quantity_gross,
                quantity_refunded=quantity_refunded,
                quantity_net=quantity_gross - quantity_refunded,
                subtotal_gross=subtotal_gross,
                subtotal_refunded=subtotal_refunded,
                subtotal_net=subtotal_gross - subtotal_refunded,
                total_gross=total_gross,
                total_refunded=total_refunded,
                total_net=total_gross - total_refunded,
            )
        )
    return sorted(metrics, key=lambda metric: metric.subtotal_net, reverse=True)[:limit]


def _validate_period(start_date: date, end_date: date) -> None:
    if start_date > end_date:
        raise ValueError("start_date must not be after end_date.")
