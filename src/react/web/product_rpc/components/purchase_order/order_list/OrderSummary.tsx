import { useAppSelector } from "../../../app/hooks";
import { selectIsTaxed } from "../../../app/slice/order/orderDetailsSlice";
import { selectOrderList } from "../../../app/slice/order/orderListSlice";
import { OrderItem, PERUVIAN_TAX } from "../../../types/purchaseOrder";
import { getCurrencyFormat } from "../../../utils/utils";

const getTotals = (orderList: OrderItem[]) => {
  let totalQty = 0,
    totalPrice = 0;
  for (const orderItem of orderList)
    for (const productRow of orderItem.product_matrix)
      for (const productItem of productRow.product_items) {
        if (productItem.qty === 0 || productItem.price === 0) continue;
        totalQty += productItem.qty;
        totalPrice += productItem.price * productItem.qty;
      }
  return [totalQty, totalPrice];
};

export const OrderSummary = () => {
  const orderList = useAppSelector(selectOrderList);
  const isTaxAdded = useAppSelector(selectIsTaxed);
  const [totalQty, totalPrice] = getTotals(orderList);
  const totalTax = totalPrice * PERUVIAN_TAX;

  return (
    <div className="flex justify-end text-xs font-mono">
      <table style={{ width: "250px" }}>
        <tbody>
          <tr>
            <td className="text-right w-8/12">Base imponible:</td>
            <td className="text-right w-4/12">
              {getCurrencyFormat(totalPrice + (isTaxAdded ? -totalTax : 0))}
            </td>
          </tr>
          <tr className="border-gray-800 border-b">
            <td className="text-right pb-1">Total de impuestos:</td>
            <td className="text-right pb-1">{getCurrencyFormat(totalTax)}</td>
          </tr>
          <tr className="font-semibold">
            <td className="text-right pt-1">Total:</td>
            <td className="text-right pt-1">
              {getCurrencyFormat(totalPrice + (isTaxAdded ? 0 : +totalTax))}
            </td>
          </tr>
          <tr className="font-semibold">
            <td className="text-right">Cantidad Total:</td>
            <td className="text-right">{totalQty}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
