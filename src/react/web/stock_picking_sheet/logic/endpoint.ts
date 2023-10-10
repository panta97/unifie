import { Stock, StockMoveLine, StockPickingDetails } from "../types";

export const getStock = async (urlParams: URLSearchParams) => {
  const id = urlParams.get("id");
  const endpoint = `${window.location.origin}/api/barcode/stock-picking/${id}`;
  if (!id || !endpoint) return;
  try {
    const response = await (await fetch(endpoint)).json();
    if (response.statusCode === 200) {
      const stockPickingDetails: StockPickingDetails =
        response.stock_picking_details;
      const stockMoveLines: StockMoveLine[] = response.stock_move_lines;
      const stock: Stock = {
        stock_picking_details: stockPickingDetails,
        stock_move_lines: stockMoveLines,
      };
      return stock;
    }
  } catch (error) {
    console.log(error);
  }
};
