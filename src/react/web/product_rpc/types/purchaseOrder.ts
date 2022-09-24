import { CatalogGeneric } from "./shared";

export interface Attr {
  attr: CatalogGeneric;
  attr_vals: CatalogGeneric[];
}

export interface ProductItem {
  id: number;
  name: string;
  attrs: number[];
  qty: number;
  price: number;
}

export interface ProductRow {
  id: number;
  product_items: ProductItem[];
}

export interface OrderItem {
  odoo_link: string;
  is_in_list: boolean;
  id: number;
  name: string;
  date: string;
  product_matrix: ProductRow[];
  attr_cols?: Attr;
  attr_rows?: Attr;
}

export interface OrderForm {
  tax: boolean;
  partner_id: number;
  partner_ref: string;
  order_items: OrderItem[];
}

export interface OrderResult {
  odoo_id: number;
  odoo_link: string;
}

export const PERUVIAN_TAX = 0.18;
