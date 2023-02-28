import React from 'react';
import { batch } from "react-redux";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  resetOrderItem,
  selectOrderItem,
} from "../../../app/slice/order/orderItemSlice";
import {
  addItem,
  updateSelectedItem,
} from "../../../app/slice/order/orderListSlice";
import { OrderItem } from "../../../types/purchaseOrder";
import { orderItemSchema } from "../Validation";

export const AddButton = () => {
  const orderItem = useAppSelector(selectOrderItem);
  const dispatch = useAppDispatch();

  const handleValidation = async (func: Function) => {
    try {
      await orderItemSchema.validate(orderItem);
      func();
    } catch (error) {
      alert(error);
    }
  };

  const handleAddOrderItem = () => {
    batch(() => {
      dispatch(addItem({ orderItem }));
      dispatch(resetOrderItem());
    });
  };

  const handleUpdateOrderItem = (orderItem: OrderItem) => {
    batch(() => {
      dispatch(updateSelectedItem({ orderItem }));
      dispatch(resetOrderItem());
    });
  };

  return (
    <div className="flex justify-end pt-2 border-gray-500">
      <button
        className="rounded bg-gray-100 px-2 py-1 cursor-pointer w-24"
        onClick={(e) => {
          orderItem.is_in_list
            ? handleValidation(() => handleUpdateOrderItem(orderItem))
            : handleValidation(() => handleAddOrderItem());
          e.currentTarget.blur();
        }}
      >
        {orderItem.is_in_list ? "Actualizar" : "Agregar"}
      </button>
    </div>
  );
};
