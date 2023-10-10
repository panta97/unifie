export interface StockPickingDetails {
  id: number;
  name: string;
  picking_type: string;
  location: string;
  location_dest: string;
}

export interface StockMoveLine {
  id: number;
  product_name: string;
  product_cost: number;
  location: string;
  location_dest: string;
  qty_done: number;
}

export interface Stock {
  stock_picking_details: StockPickingDetails;
  stock_move_lines: StockMoveLine[];
}
