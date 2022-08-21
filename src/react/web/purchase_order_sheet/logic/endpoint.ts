import { Order, OrderDetails, OrderLine } from "../types";

export const getPurchaseOrder = async (urlParams: URLSearchParams) => {
  const model = urlParams.get("model");
  const id = urlParams.get("id");
  const endpoint = `${urlParams.get("api")}?model=${model}&id=${id}`;
  const params = {
    headers: {
      "x-api-key": urlParams.get("key")!,
    },
  };
  if (!model || !id || !endpoint || !params) return;
  try {
    const response = await (await fetch(endpoint, params)).json();
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
