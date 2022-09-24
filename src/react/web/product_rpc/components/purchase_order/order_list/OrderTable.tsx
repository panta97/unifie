import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectFormOrderState } from "../../../app/slice/order/formSlice";
import { selectIsTaxed } from "../../../app/slice/order/orderDetailsSlice";
import {
  replaceItem,
  selectOrderItemId,
} from "../../../app/slice/order/orderItemSlice";
import {
  deleteSelectedItem,
  selectOrderList,
} from "../../../app/slice/order/orderListSlice";
import { ProductFormState } from "../../../types/product";
import { OrderItem, PERUVIAN_TAX } from "../../../types/purchaseOrder";
import { getCurrencyFormat } from "../../../utils/utils";
import { Svg } from "../../shared/Svg";

export const OrderTable = () => {
  const formState = useAppSelector(selectFormOrderState);
  const orderItemId = useAppSelector(selectOrderItemId);
  const orderList = useAppSelector(selectOrderList);
  const isTaxed = useAppSelector(selectIsTaxed);
  const tax = isTaxed ? PERUVIAN_TAX : 0;
  const dispatch = useAppDispatch();

  const handleEditOrderItem = (orderItem: OrderItem) => {
    dispatch(replaceItem({ orderItem }));
  };

  const handleDeleteOrderItem = (orderItemId: number) => {
    dispatch(deleteSelectedItem({ orderItemId }));
  };

  return (
    <div className="text-xs border border-gray-200 mb-2 overflow-hidden rounded-md font-mono">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-100 text-gray-500">
            <th className="text-left border-r last:border-r-0 font-normal p-1 w-9/12">
              Producto
            </th>
            <th className="text-left border-r last:border-r-0 font-normal p-1 w-1/12">
              Cantidad
            </th>
            <th className="text-left border-r last:border-r-0 font-normal p-1 w-1/12">
              Precio U.
            </th>
            <th className="text-left border-r last:border-r-0 font-normal p-1 w-1/12">
              Subtotal
            </th>
            {formState === ProductFormState.DRAF && <th />}
          </tr>
        </thead>
        <>
          {orderList.map((orderItem, idx) => {
            let idxOICopy = idx - 1;
            return (
              <tbody
                key={orderItem.id}
                className="border-b-2 border-gray-200 last:border-0"
              >
                {orderItem.product_matrix.map((productRow) => {
                  return productRow.product_items
                    .filter((productItem) => productItem.qty > 0)
                    .map((productItem) => {
                      idxOICopy += 1;
                      return (
                        <tr
                          key={productItem.id}
                          className="border-b last:border-b-0 border-gray-200 text-gray-700"
                        >
                          <td className="text-left border-r font-normal p-1">
                            {productItem.name}
                          </td>
                          <td className="text-left border-r font-normal p-1">
                            {productItem.qty}
                          </td>
                          <td className="text-right border-r font-normal p-1">
                            {getCurrencyFormat(productItem.price)}
                          </td>
                          <td className="text-right border-r font-normal p-1">
                            {getCurrencyFormat(
                              productItem.qty * productItem.price * (1 - tax)
                            )}
                          </td>
                          {formState === ProductFormState.DRAF &&
                            idx === idxOICopy && (
                              <td className={`p-1 bg-white`} rowSpan={999}>
                                <div className="flex flex-col">
                                  {orderItem.id === orderItemId && (
                                    <span
                                      title="Editando"
                                      className="px-1 text-white text-center bg-emerald-400 rounded select-none"
                                    >
                                      E
                                    </span>
                                  )}
                                  <span title="Editar">
                                    <Svg.PencilAlt
                                      className="h-5 w-5 mx-auto cursor-pointer"
                                      onClick={() =>
                                        handleEditOrderItem(orderItem)
                                      }
                                    />
                                  </span>
                                  <span title="Eliminar">
                                    <Svg.Trash
                                      className="h-5 w-5 mx-auto cursor-pointer"
                                      onClick={() =>
                                        handleDeleteOrderItem(orderItem.id)
                                      }
                                    />
                                  </span>
                                </div>
                              </td>
                            )}
                        </tr>
                      );
                    });
                })}
              </tbody>
            );
          })}
        </>
      </table>
    </div>
  );
};
