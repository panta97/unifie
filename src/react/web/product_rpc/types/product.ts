import { ProductAttribute, ProductAttributeValue } from "./catalogs";

interface Attr {
  id: number;
  id_vals: number[];
}

interface AttrDefaultCodeMap {
  attr_val_ids: number[];
  default_code: string;
}

export interface ProductProduct {
  name: string;
  list_price: number;
  categ_id: number;
  pos_categ_id: number;
  attrs: Attr[];
  attr_default_code_map: AttrDefaultCodeMap[];
}

export interface AttributeForm {
  editing: boolean;
  attr: Partial<ProductAttribute>;
  attr_vals: Partial<ProductAttributeValue>[];
  is_default_code_grouped: boolean;
  is_list_price_grouped: boolean;
}

export interface AttributeDefaultCodeForm {
  attr_val_ids: Partial<ProductAttributeValue>[];
  default_code: string;
}

export interface AttributeListPrice {
  attr_val_ids: Partial<ProductAttributeValue>[];
  list_price: number;
}

// Product list form state
export enum ProductFormState {
  DRAF,
  CREATED,
}

export interface ProductProductForm {
  // helper props
  id: number;
  is_in_list: boolean;
  odoo_id?: number;
  odoo_link?: string;
  // product props
  name: string;
  list_price: number;
  default_code: string;
  category_line_name: string;
  category_line_id: number;
  category_family_name: string;
  category_family_id: number;
  category_brand_name: string;
  category_brand_id: number;
  pos_categ_id: number;
  pos_categ_name: string;
  attrs: AttributeForm[];
  attr_default_code: AttributeDefaultCodeForm[];
  attr_list_price: AttributeListPrice[];
  weight: number;
}

export interface ProductResult {
  odoo_id: number;
  odoo_link: string;
  client_id: number;
}
