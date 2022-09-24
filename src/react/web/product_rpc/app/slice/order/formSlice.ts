import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FetchStatus } from "../../../types/fetch";
import { ProductFormState } from "../../../types/product";
import { RootState } from "../../store";

export type FormState = {
  formState: ProductFormState;
  status: FetchStatus;
  itemStatus: FetchStatus;
};

const initialState: FormState = {
  formState: ProductFormState.DRAF,
  status: FetchStatus.IDLE,
  itemStatus: FetchStatus.IDLE,
};

export const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {
    updateItemStatus: (
      state,
      { payload }: PayloadAction<{ itemStatus: FetchStatus }>
    ) => {
      state.itemStatus = payload.itemStatus;
    },
    updateOrderFormStatus: (
      state,
      { payload }: PayloadAction<{ status: FetchStatus }>
    ) => {
      state.status = payload.status;
    },
    updateOrderFormState: (
      state,
      { payload }: PayloadAction<{ formState: ProductFormState }>
    ) => {
      state.formState = payload.formState;
    },
  },
});

export const { updateItemStatus, updateOrderFormStatus, updateOrderFormState } =
  formSlice.actions;

export const selectFormItemStatus = (state: RootState) =>
  state.order.form.itemStatus;

export const selectFormOrderState = (state: RootState) =>
  state.order.form.formState;

export const selectFormOrderStatus = (state: RootState) =>
  state.order.form.status;

export default formSlice.reducer;
