export interface MoveLine {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price_unit: number;
  price_total: number;
}

export interface MoveLineDiscount extends MoveLine {
  discount: number;
}
