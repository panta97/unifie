import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";

export type OrderDetailsState = {
  // helper props
  odoo_id?: number;
  odoo_link?: string;
  // order props
  partner_id: number;
  partner_name: string;
  partner_ref: string;
  is_taxed: boolean;
};

const initialState: OrderDetailsState = {
  partner_id: 0,
  partner_name: "",
  partner_ref: "",
  is_taxed: true,
};

export const orderDetailsSlice = createSlice({
  name: "orderDetails",
  initialState,
  reducers: {
    updatePartner: (
      state,
      { payload }: PayloadAction<{ partnerId: number; partnerName: string }>
    ) => {
      state.partner_id = payload.partnerId;
      state.partner_name = payload.partnerName;
    },
    updatePartnerRef: (
      state,
      { payload }: PayloadAction<{ partnerRef: string }>
    ) => {
      state.partner_ref = payload.partnerRef;
    },
    updateTax: (state, { payload }: PayloadAction<{ isTaxed: boolean }>) => {
      state.is_taxed = payload.isTaxed;
    },
    updateHelperProps: (
      state,
      { payload }: PayloadAction<{ odooId: number; odooLink: string }>
    ) => {
      state.odoo_id = payload.odooId;
      state.odoo_link = payload.odooLink;
    },
    resetOrderDetails: (state) => {
      state.odoo_id = undefined;
      state.odoo_link = undefined;
      state.partner_id = 0;
      state.partner_name = "";
      state.partner_ref = "";
      state.is_taxed = false;
    },
  },
});

export const {
  updatePartner,
  updatePartnerRef,
  updateTax,
  updateHelperProps,
  resetOrderDetails,
} = orderDetailsSlice.actions;

export const selectOrderDetails = (state: RootState) =>
  state.order.orderDetails;
export const selectPartnerId = (state: RootState) =>
  state.order.orderDetails.partner_id;
export const selectPartnerName = (state: RootState) =>
  state.order.orderDetails.partner_name;
export const selectPartnerRef = (state: RootState) =>
  state.order.orderDetails.partner_ref;
export const selectIsTaxed = (state: RootState) =>
  state.order.orderDetails.is_taxed;

export default orderDetailsSlice.reducer;
