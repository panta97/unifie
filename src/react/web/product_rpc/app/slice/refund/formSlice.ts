import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FetchStatus } from "../../../types/fetch";
import { RootState } from "../../store";

export type FormState = {
  invoiceStatus: FetchStatus;
  refundStatus: FetchStatus;
};

const initialState: FormState = {
  invoiceStatus: FetchStatus.IDLE,
  refundStatus: FetchStatus.IDLE,
};

export const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {
    updateInvoiceStatus: (
      state,
      {
        payload: { invoiceStatus },
      }: PayloadAction<{ invoiceStatus: FetchStatus }>
    ) => {
      state.invoiceStatus = invoiceStatus;
    },
    updateRefundStatus: (
      state,
      {
        payload: { refundStatus },
      }: PayloadAction<{ refundStatus: FetchStatus }>
    ) => {
      state.refundStatus = refundStatus;
    },
  },
});

export const { updateInvoiceStatus, updateRefundStatus } = formSlice.actions;

export const selectFormIvoiceStatus = (state: RootState) =>
  state.refund.form.invoiceStatus;

export const selectFormRefundStatus = (state: RootState) =>
  state.refund.form.refundStatus;

export default formSlice.reducer;
