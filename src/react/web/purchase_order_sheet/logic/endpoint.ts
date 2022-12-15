import { Order, OrderDetails, OrderLine } from "../types";

export const getPurchaseOrder = async (urlParams: URLSearchParams) => {
  const id = urlParams.get("id");
  const endpoint = `${window.location.origin}/api/barcode/purchase-order-sheet/${id}`;
  if (!id || !endpoint) return;
  try {
    const response = await (await fetch(endpoint)).json();
    if (response.statusCode === 200) {
      const orderDetails: OrderDetails = response.order_details;
      const orderLines: OrderLine[] = response.order_lines;
      const order: Order = {
        order_details: orderDetails,
        order_lines: orderLines,
      };
      return order;
    }
  } catch (error) {
    console.log(error);
  }
};
