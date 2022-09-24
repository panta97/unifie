import { OrderForm, OrderItem } from "../../types/purchaseOrder";

export const getPOItemIS = (): OrderItem => {
  return {
    odoo_link: "",
    is_in_list: false,
    id: 0,
    name: "",
    date: "",
    product_matrix: [],
  };
};

export const getPOFormIS = (): OrderForm => {
  return {
    tax: false,
    partner_id: 0,
    partner_ref: "",
    order_items: [],
  };
};
