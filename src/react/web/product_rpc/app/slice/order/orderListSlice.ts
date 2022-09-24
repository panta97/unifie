import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OrderItem } from "../../../types/purchaseOrder";
import { RootState } from "../../store";

export type OrderListState = OrderItem[];

const initialState: OrderListState = [];

export const orderListSlice = createSlice({
  name: "orderList",
  initialState,
  reducers: {
    addItem: (state, { payload }: PayloadAction<{ orderItem: OrderItem }>) => {
      const newOrderItem = { ...payload.orderItem };
      newOrderItem.is_in_list = true;
      state.push(newOrderItem);
    },
    updateSelectedItem: (
      state,
      { payload }: PayloadAction<{ orderItem: OrderItem }>
    ) => {
      state.forEach((order) => {
        if (order.id === payload.orderItem.id) {
          order.product_matrix = payload.orderItem.product_matrix;
          order.attr_cols = payload.orderItem.attr_cols;
          order.attr_rows = payload.orderItem.attr_rows;
        }
      });
    },
    deleteSelectedItem: (
      state,
      { payload }: PayloadAction<{ orderItemId: number }>
    ) => {
      const orderIdx = state.findIndex(
        (order) => order.id === payload.orderItemId
      );
      if (orderIdx > -1) state.splice(orderIdx, 1);
    },
    resetOrderList: (state) => {
      state.splice(0, state.length);
    },
  },
});

export const {
  addItem,
  updateSelectedItem,
  deleteSelectedItem,
  resetOrderList,
} = orderListSlice.actions;

export const selectOrderList = (state: RootState) => state.order.orderList;

export default orderListSlice.reducer;
