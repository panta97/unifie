from datetime import date
from decimal import Decimal
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from kdosh_odoo import SalesLine

from .sales_analysis import analyze_sales, intent_from_question
from .openrouter import explain_analysis
from .sales_metrics import get_product_ranking, get_store_totals, store_for_line


def _line(
    *,
    line_id: int,
    product_id: int,
    product_name: str,
    journal_name: str,
    journal_id: int | None = None,
    move_type: str = "out_invoice",
    quantity: str = "1",
    subtotal: str = "10",
    total: str = "11.8",
) -> SalesLine:
    return SalesLine(
        id=line_id,
        invoice_id=line_id,
        invoice_date=date(2026, 9, 29),
        move_type=move_type,
        company_id=None,
        company_name=None,
        journal_id=journal_id,
        journal_name=journal_name,
        product_id=product_id,
        product_name=product_name,
        description=product_name,
        quantity=Decimal(quantity),
        unit_price=Decimal(subtotal),
        discount=Decimal("0"),
        subtotal=Decimal(subtotal),
        total=Decimal(total),
    )


class SalesMetricsTests(SimpleTestCase):
    def test_store_mapping_excludes_san_martin_and_maps_active_stores(self):
        self.assertEqual(store_for_line(_line(line_id=1, product_id=1, product_name="Polo M", journal_name="Boleta B001")), "abtao")
        self.assertEqual(store_for_line(_line(line_id=2, product_id=2, product_name="Polo L", journal_name="Boleta B011")), "tingo maria")
        self.assertEqual(store_for_line(_line(line_id=4, product_id=4, product_name="Polo NC", journal_name="Nota Crédito BA01", journal_id=37)), "abtao")
        self.assertIsNone(store_for_line(_line(line_id=3, product_id=3, product_name="Polo XL", journal_name="Boleta B010")))

    @patch("miscellaneous.sales_metrics.get_sales_lines")
    def test_store_totals_only_return_abtao_and_tingo_maria(self, get_sales_lines):
        get_sales_lines.return_value = (
            _line(line_id=1, product_id=1, product_name="Polo M", journal_name="Boleta B001"),
            _line(line_id=2, product_id=2, product_name="Polo L", journal_name="Boleta B011", total="20"),
            _line(line_id=3, product_id=3, product_name="Polo XL", journal_name="Boleta B010", total="30"),
        )

        totals = get_store_totals(date(2026, 9, 29), date(2026, 9, 29))

        self.assertEqual(totals, [
            {"code": "ab-store", "name": "abtao", "amount": Decimal("11.8")},
            {"code": "tg-store", "name": "tingo maria", "amount": Decimal("20")},
        ])

    @patch("miscellaneous.sales_metrics.get_sales_lines")
    def test_product_ranking_keeps_full_variant_name_and_refunds_separate(self, get_sales_lines):
        get_sales_lines.return_value = (
            _line(line_id=1, product_id=1, product_name="Polo negro - Talla M", journal_name="Boleta B001", quantity="2", subtotal="20", total="23.6"),
            _line(line_id=2, product_id=1, product_name="Polo negro - Talla M", journal_name="Boleta B001", move_type="out_refund", quantity="1", subtotal="-10", total="-11.8"),
        )

        [metric] = get_product_ranking(date(2026, 9, 29), date(2026, 9, 29))

        self.assertEqual(metric.product_name, "Polo negro - Talla M")
        self.assertEqual(metric.quantity_net, Decimal("1"))
        self.assertEqual(metric.subtotal_net, Decimal("10"))

    def test_question_is_mapped_to_supported_intent_and_store(self):
        self.assertEqual(
            intent_from_question("¿Qué productos subieron en Abtao?"),
            ("products_up", "abtao"),
        )

    @patch.dict("os.environ", {"OPENROUTER_API_KEY": "", "OPENROUTER_MODEL": ""}, clear=False)
    @patch("miscellaneous.sales_analysis.get_product_ranking")
    def test_analysis_uses_store_from_question_context(self, get_product_ranking):
        get_product_ranking.return_value = []

        analyze_sales("top_products", date(2026, 9, 29), period="week", store="tingo maria")

        self.assertEqual(get_product_ranking.call_args.kwargs["store"], "tingo maria")

    @patch.dict("os.environ", {"OPENROUTER_API_KEY": "", "OPENROUTER_MODEL": ""}, clear=False)
    @patch("miscellaneous.sales_analysis.get_product_ranking")
    def test_analysis_returns_equivalent_periods_and_table(self, get_product_ranking):
        get_product_ranking.return_value = [
            _line_metric(product_id=9, product_name="Polo azul - Talla M", subtotal="25")
        ]

        result = analyze_sales("top_products", date(2026, 9, 3), period="week", limit=5)

        self.assertEqual(result["period"]["current"], {"start": "2026-08-31", "end": "2026-09-03"})
        self.assertEqual(result["period"]["previous"], {"start": "2026-08-24", "end": "2026-08-27"})
        self.assertEqual(result["rows"][0]["product_name"], "Polo azul - Talla M")
        self.assertEqual(result["rows"][0]["amount"], "25.00")
        self.assertEqual(result["ai"]["status"], "not_configured")

    @patch.dict("os.environ", {"OPENROUTER_API_KEY": "test-key", "OPENROUTER_MODEL": "test/model"})
    @patch("miscellaneous.openrouter.requests.post")
    def test_openrouter_receives_only_aggregated_analysis_data(self, post):
        response = Mock()
        response.json.return_value = {
            "choices": [{"message": {"content": "Abtao vendió más en este periodo."}}]
        }
        post.return_value = response
        analysis = {
            "intent": "store_comparison",
            "period": {"current": {"start": "2026-09-03", "end": "2026-09-03"}},
            "rows": [{"store": "abtao", "current": "100.00"}],
            "answer": "fallback",
        }

        result = explain_analysis(analysis)

        request_payload = post.call_args.kwargs["json"]
        self.assertEqual(request_payload["model"], "test/model")
        self.assertNotIn("api_key", request_payload)
        self.assertIn('"rows": [{"store": "abtao", "current": "100.00"}]', request_payload["messages"][1]["content"])
        self.assertEqual(result["ai"]["status"], "generated")


def _line_metric(*, product_id: int, product_name: str, subtotal: str) -> object:
    from .sales_metrics import ProductSalesMetric

    amount = Decimal(subtotal)
    return ProductSalesMetric(
        product_id=product_id,
        product_name=product_name,
        quantity_gross=Decimal("1"),
        quantity_refunded=Decimal("0"),
        quantity_net=Decimal("1"),
        subtotal_gross=amount,
        subtotal_refunded=Decimal("0"),
        subtotal_net=amount,
        total_gross=amount,
        total_refunded=Decimal("0"),
        total_net=amount,
    )
