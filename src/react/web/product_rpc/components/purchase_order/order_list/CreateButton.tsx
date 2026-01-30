import React from 'react';
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
import { purchaseOrderApi } from "../../../services/purchaseOrderApi";

interface CreateButtonProps {
  editMode?: boolean;
  currentOrderId?: number | null;
  onUpdateSuccess?: () => void;
}

export const CreateButton: React.FC<CreateButtonProps> = ({ 
  editMode = false, 
  currentOrderId = null,
  onUpdateSuccess 
}) => {
  const formState = useAppSelector(selectFormOrderState);
  const orderDetails = useAppSelector(selectOrderDetails);
  const orderList = useAppSelector(selectOrderList);
  const dispatch = useAppDispatch();

  const handleUploadOrder = async () => {
    try {
      await orderDetailsSchema.validate(orderDetails);
      await orderListSchema.validate(orderList);
      
      dispatch(updateOrderFormStatus({ status: FetchStatus.LOADING }));

      const orderData = {
        order_details: orderDetails,
        order_list: orderList,
      };
      
      let json;

      if (editMode && currentOrderId) {
        const response = await purchaseOrderApi.update(currentOrderId, orderData);
        json = response;
        
        if (json.result === fetchResult.SUCCESS && onUpdateSuccess) {
          console.log("✅ [CreateButton] Update SUCCESS - Llamando onUpdateSuccess");
          onUpdateSuccess();
        }
      } else {
        const params = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.localStorage.getItem("token")}`,
          },
          body: JSON.stringify(orderData),
        };
        const response = await fetch("/api/product-rpc/purchase_order", params);
        json = await response.json();
      }

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
      } else {
        throw new Error(json.message);
      }
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

  const buttonText = editMode ? "Actualizar" : "Crear";

  return formState === ProductFormState.DRAF ? (
    <button
      onClick={(e) => {
        handleUploadOrder();
        e.currentTarget.blur();
      }}
      className="rounded bg-gray-100 px-2 py-1 cursor-pointer w-24"
    >
      {buttonText}
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
