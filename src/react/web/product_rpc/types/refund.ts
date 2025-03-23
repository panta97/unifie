import { CatalogGeneric } from "./shared";

export interface Payment {
  journal_name: string;
  amount: number;
}

export interface Partner {
  id: number;
  name: string;
  doc_number: string;
  odoo_link: string;
}

export interface Line {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  discount: number;
  price_unit: number;
  price_subtotal: number;
  qty_refund: number;
  price_unit_refund: number;
  price_subtotal_refund: number;
  is_editing_refund: boolean;
}

export interface RefundResult {
  refund_invoice: string;
  stock_move: string;
}

export interface InvoiceSummary {
  id: number;
  number: string;
  create_date: string;
  odoo_link: string;
}

export interface InvoiceDetails {
  id: number;
  // helper props
  has_refund: boolean;
  refund_invoices: InvoiceSummary[];
  stock_moves: InvoiceSummary[];

  journal: string;
  number: string;
  create_date: string;
  date_invoice: string;
  journal_sunat_type: string;
  amount_untaxed: number;
  amount_total: number;
  payments: Payment[];
  user: string;
  currency: string;
  partner: Partner;
  lines: Line[];
}

export interface CreditDetails {
  id: number;
  // helper props
  has_refund: boolean;
  refund_invoices: InvoiceSummary[];
  stock_moves: InvoiceSummary[];

  journal: string;
  number: string;
  create_date: string;
  date_invoice: string;
  journal_sunat_type: string;
  amount_untaxed: number;
  amount_total: number;
  payments: Payment[];
  user: string;
  currency: string;
  partner: Partner;
  lines: Line[];
}

export interface StockLocation extends CatalogGeneric {
  parent_location_id: number;
  original_location_id: number;
}
