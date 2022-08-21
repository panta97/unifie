export interface OrderDetails {
  username: string;
  datetime: string;
  name: string;
  partner_name: string;
  partner_ref: string;
}

export interface OrderLine {
  name: string;
  cats: string;
  quantity: number;
  datetime: string;
}

export interface Order {
  order_details: OrderDetails;
  order_lines: OrderLine[];
}

export interface Catalog {
  id: number;
  name: string;
}
