import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Catalogs } from "../../../types/catalogs";
import { RootState } from "../../store";

export type CatalogState = Catalogs;

const initialState: CatalogState = {
  product_category_line: [],
  product_category_family: [],
  product_category_brand: [],
  pos_category: [],
  product_attribute: [],
  product_attribute_value: [],
  // see how to handle this based on catalogs endpoind
  weight_list: [],
};

export const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    updateAll: (
      state,
      { payload: { catalogs } }: PayloadAction<{ catalogs: Catalogs }>
    ) => {
      state.product_category_line = catalogs.product_category_line;
      state.product_category_family = catalogs.product_category_family;
      state.product_category_brand = catalogs.product_category_brand;
      state.pos_category = catalogs.pos_category;
      state.product_attribute = catalogs.product_attribute;
      state.product_attribute_value = catalogs.product_attribute_value;
    },
  },
});

export const { updateAll } = catalogSlice.actions;

export const selectCatalogs = (state: RootState) => state.product.catalog;

export default catalogSlice.reducer;
