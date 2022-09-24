import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OrderCatalogs } from "../../../types/catalogs";
import { RootState } from "../../store";

export type CatalogState = OrderCatalogs;

const initialState: CatalogState = {
  res_partner: [],
};

export const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    updateOrderAll: (
      state,
      { payload: { catalogs } }: PayloadAction<{ catalogs: OrderCatalogs }>
    ) => {
      state.res_partner = catalogs.res_partner;
    },
  },
});

export const { updateOrderAll } = catalogSlice.actions;

export const selectPartnerCatalog = (state: RootState) =>
  state.order.catalog.res_partner;

export default catalogSlice.reducer;
