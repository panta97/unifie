import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { cloneDeep } from "lodash";
import { ProductProductForm, ProductResult } from "../../../types/product";
import { RootState } from "../../store";
import { FetchStatus } from "../../../types/fetch";

export type ProductListState = ProductProductForm[];

const initialState: ProductListState = [];

export const productListSlice = createSlice({
  name: "productList",
  initialState,
  reducers: {
    addProduct: (
      state,
      { payload: { product } }: PayloadAction<{ product: ProductProductForm }>
    ) => {
      const prod2 = { ...product };
      prod2.is_in_list = true;
      state.push(prod2);
    },
    updateSelectedProduct: (
      state,
      { payload: { product } }: PayloadAction<{ product: ProductProductForm }>
    ) => {
      state.forEach((prod) => {
        if (prod.id === product.id) {
          prod.id = product.id;
          prod.is_in_list = product.is_in_list;
          prod.name = product.name;
          prod.list_price = product.list_price;
          prod.default_code = product.default_code;
          prod.weight = product.weight;
          prod.category_line_name = product.category_line_name;
          prod.category_line_id = product.category_line_id;
          prod.category_family_name = product.category_family_name;
          prod.category_family_id = product.category_family_id;
          prod.category_brand_name = product.category_brand_name;
          prod.category_brand_id = product.category_brand_id;
          prod.category_last_name = product.category_last_name;
          prod.category_last_id = product.category_last_id;
          prod.pos_categ_ids = product.pos_categ_ids;
          prod.pos_categ_name = product.pos_categ_name;
          prod.attrs = product.attrs;
          prod.attr_default_code = product.attr_default_code;
          prod.attr_list_price = product.attr_list_price;
        }
      });
    },
    updateProductListFetchStatus: (
      state,
      {
        payload: { productIds, fetchStatus },
      }: PayloadAction<{ productIds: number[]; fetchStatus: FetchStatus }>
    ) => {
      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];
        const product = state.find((product) => product.id === productId);
        if (!product) continue;
        product.fetch_status = fetchStatus;
      }
    },
    duplicateSelectedProduct: (
      state,
      { payload: { productId } }: PayloadAction<{ productId: number }>
    ) => {
      const productIndex = state.findIndex(
        (product) => product.id === productId
      );
      const productDuplicate = cloneDeep(
        state.find((product) => product.id === productId)!
      );
      productDuplicate.id = new Date().getTime();
      productDuplicate.name += " copia";
      state.splice(productIndex + 1, 0, productDuplicate);
    },
    deleteSelectedProduct: (
      state,
      { payload: { productId } }: PayloadAction<{ productId: number }>
    ) => {
      const idx = state.findIndex((product) => product.id === productId);
      if (idx !== -1) {
        state.splice(idx, 1);
      }
    },
    setOdooLink: (
      state,
      {
        payload: { productResults },
      }: PayloadAction<{ productResults: ProductResult[] }>
    ) => {
      state.forEach((product) => {
        const productResult = productResults.find(
          (prodRes) => prodRes.client_id === product.id
        );
        if (!productResult) return;
        product.odoo_id = productResult.odoo_id;
        product.odoo_link = productResult.odoo_link;
      });
      // TODO: handle productSlice
    },
    reset: (state) => {
      state.splice(0, state.length);
    },
  },
});

export const {
  addProduct,
  updateSelectedProduct,
  updateProductListFetchStatus,
  duplicateSelectedProduct,
  deleteSelectedProduct,
  setOdooLink,
  reset,
} = productListSlice.actions;

export const selectProducts = (state: RootState) => state.product.productList;

export default productListSlice.reducer;
