import { batch } from "react-redux";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectFormOrderState,
  updateOrderFormState,
  updateOrderFormStatus,
} from "../../../app/slice/order/formSlice";
import {
  resetOrderDetails,
  selectOrderDetails,
  updateHelperProps,
} from "../../../app/slice/order/orderDetailsSlice";
import { resetOrderItem } from "../../../app/slice/order/orderItemSlice";
import {
  resetOrderList,
  selectOrderList,
} from "../../../app/slice/order/orderListSlice";
import { fetchResult, FetchStatus } from "../../../types/fetch";
import { ProductFormState } from "../../../types/product";
import { OrderResult } from "../../../types/purchaseOrder";
import { orderDetailsSchema, orderListSchema } from "../Validation";

export const CreateButton = () => {
  const formState = useAppSelector(selectFormOrderState);
  const orderDetails = useAppSelector(selectOrderDetails);
  const orderList = useAppSelector(selectOrderList);
  const dispatch = useAppDispatch();

  const handleUploadOrder = async () => {
    try {
      await orderDetailsSchema.validate(orderDetails);
      await orderListSchema.validate(orderList);
      dispatch(updateOrderFormStatus({ status: FetchStatus.LOADING }));
      const params = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          order_details: orderDetails,
          order_list: orderList,
        }),
      };
      const response = await fetch("api/purchase_order", params);
      const json = await response.json();
      if (json.result === fetchResult.SUCCESS) {
        batch(() => {
          const orderResult: OrderResult = json.order;
          dispatch(
            updateHelperProps({
              odooId: orderResult.odoo_id,
              odooLink: orderResult.odoo_link,
            })
          );
          dispatch(
            updateOrderFormState({ formState: ProductFormState.CREATED })
          );
        });
      } else throw new Error(json.message);
    } catch (error) {
      alert(error);
    } finally {
      dispatch(updateOrderFormStatus({ status: FetchStatus.IDLE }));
    }
  };

  const handleResetForm = () => {
    batch(() => {
      dispatch(resetOrderDetails());
      dispatch(resetOrderItem());
      dispatch(resetOrderList());
      dispatch(updateOrderFormState({ formState: ProductFormState.DRAF }));
    });
  };

  return formState === ProductFormState.DRAF ? (
    <button
      onClick={(e) => {
        handleUploadOrder();
        e.currentTarget.blur();
      }}
      className="rounded bg-gray-100 px-2 py-1 cursor-pointer w-24"
    >
      Crear
    </button>
  ) : (
    <button
      onClick={(e) => {
        handleResetForm();
        e.currentTarget.blur();
      }}
      className="rounded text-white bg-blue-400 px-2 py-1 cursor-pointer w-24"
    >
      Nuevo
    </button>
  );
};
