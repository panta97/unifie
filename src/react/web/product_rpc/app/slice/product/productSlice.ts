import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  PosCategory,
  ProductAttribute,
  ProductCategoryBrand,
  ProductCategoryFamily,
  ProductCategoryLine,
} from "../../../types/catalogs";
import { ProductProductForm } from "../../../types/product";
import { TagData } from "../../../types/tag";
import { RootState } from "../../store";
import { cartesianDC, cartesianLP } from "./cartesian";

export type ProductState = ProductProductForm;

const initialState: ProductState = {
  id: new Date().getTime(),
  is_in_list: false,
  name: "",
  list_price: 1,
  default_code: "",
  category_line_name: "",
  category_line_id: 0,
  category_family_name: "",
  category_family_id: 0,
  category_brand_name: "",
  category_brand_id: 0,
  pos_categ_id: 0,
  pos_categ_name: "",
  attrs: [],
  attr_default_code: [],
  attr_list_price: [],
};

export const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    updateName: (state, { payload }: PayloadAction<{ name: string }>) => {
      state.name = payload.name;
    },
    updateListPrice: (
      state,
      { payload }: PayloadAction<{ listPrice: number }>
    ) => {
      state.list_price = payload.listPrice;
    },
    updateDefaultCode: (
      state,
      { payload }: PayloadAction<{ defaultCode: string }>
    ) => {
      state.default_code = payload.defaultCode;
    },
    updateLine: (
      state,
      {
        payload,
      }: PayloadAction<{
        categoryLineId: number;
        categoryLines: ProductCategoryLine[];
      }>
    ) => {
      const categoryLine = payload.categoryLines.find(
        (line) => line.id === payload.categoryLineId
      );
      if (categoryLine) {
        state.category_line_id = categoryLine.id;
        state.category_line_name = categoryLine.name;
      } else {
        state.category_line_id = 0;
        state.category_line_name = "Seleccione";
      }
      state.category_family_id = 0;
      state.category_family_name = "";
      state.category_brand_id = 0;
      state.category_brand_name = "";
    },
    updateFamily: (
      state,
      {
        payload,
      }: PayloadAction<{
        categoryFamilyId: number;
        categoryFamilies: ProductCategoryFamily[];
      }>
    ) => {
      const categoryFamily = payload.categoryFamilies.find(
        (family) => family.id === payload.categoryFamilyId
      );
      if (categoryFamily) {
        state.category_family_id = categoryFamily.id;
        state.category_family_name = categoryFamily.name;
      } else {
        state.category_family_id = 0;
        state.category_family_name = "Seleccione";
      }
      state.category_brand_id = 0;
      state.category_brand_name = "";
    },
    updateBrand: (
      state,
      {
        payload,
      }: PayloadAction<{
        categoryBrandId: number;
        categoryBrands: ProductCategoryBrand[];
      }>
    ) => {
      const categoryBrand = payload.categoryBrands.find(
        (brand) => brand.id === payload.categoryBrandId
      );
      if (categoryBrand) {
        state.category_brand_id = categoryBrand.id;
        state.category_brand_name = categoryBrand.name;
      } else {
        state.category_brand_id = 0;
        state.category_brand_name = "Seleccione";
      }
    },
    updatePosCat: (
      state,
      {
        payload,
      }: PayloadAction<{ posCatId: number; posCategories: PosCategory[] }>
    ) => {
      const posCat = payload.posCategories.find(
        (posCat) => posCat.id === payload.posCatId
      );
      if (posCat) {
        state.pos_categ_id = posCat.id;
        state.pos_categ_name = posCat.name;
      } else {
        state.pos_categ_id = 0;
        state.pos_categ_name = "Seleccione";
      }
    },
    updateAttr: (
      state,
      {
        payload: { attrId, attrIndex, attributes },
      }: PayloadAction<{
        attrId: number;
        attrIndex: number;
        attributes: ProductAttribute[];
      }>
    ) => {
      // ATTRIBUTES MUST BEE DISTINCT
      if (!state.attrs.some((attr) => attr.attr.id === attrId)) {
        const newAttr = attributes.find((attr) => attr.id === attrId);
        if (newAttr) {
          state.attrs[attrIndex].attr = newAttr;
        }
      }
    },
    updateAttrVal: (
      state,
      {
        payload: { newTags, attrId },
      }: PayloadAction<{ newTags: TagData[]; attrId: number }>
    ) => {
      let oldAttrVals = [];
      // TODO: improve code you might increment the array for new tags instead of replacing it
      state.attrs.forEach((attr) => {
        if (attr.attr.id === attrId) {
          oldAttrVals = attr.attr_vals;
          attr.attr_vals = newTags;
        }
      });
      // ATTR DEFAULT CODE SIDE EFFECT
      const groupedAttrDC = state.attrs.filter(
        (attr) => attr.is_default_code_grouped
      );
      if (groupedAttrDC.length > 0 && oldAttrVals.length !== newTags.length)
        state.attr_default_code = cartesianDC(groupedAttrDC);
      if (groupedAttrDC.length === 0) state.attr_default_code = [];
      // ATTR LIST PRICE SIDE EFFECT
      const groupedAttrLP = state.attrs.filter(
        (attr) => attr.is_list_price_grouped
      );
      if (groupedAttrLP.length > 0 && oldAttrVals.length !== newTags.length)
        state.attr_list_price = cartesianLP(groupedAttrLP, state.list_price);
      if (groupedAttrLP.length === 0) state.attr_list_price = [];
    },
    addAttr: (state) => {
      // CANNOT ADD A NEW ATTRIBUTE IF SOME ARE EMPTY
      if (state.attrs.some((attr) => attr.attr.id === 0)) return;
      state.attrs.map((attr) => {
        attr.editing = false;
        return attr;
      });
      state.attrs.push({
        attr: { id: 0, name: "Seleccione" },
        attr_vals: [],
        editing: true,
        is_list_price_grouped: false,
        is_default_code_grouped: false,
      });
    },
    deleteAttr: (
      state,
      { payload: { attrId } }: PayloadAction<{ attrId: number }>
    ) => {
      const idx = state.attrs.findIndex((attr) => attr.attr.id === attrId);
      if (idx !== -1) {
        state.attrs.splice(idx, 1);
        // ATTR DEFAULT CODE SIDE EFFECT
        const groupedAttrDC = state.attrs.filter(
          (attr) => attr.is_default_code_grouped
        );
        if (groupedAttrDC.length > 0)
          state.attr_default_code = cartesianDC(groupedAttrDC);
        else state.attr_default_code = [];
        // ATTR LIST PRICE SIDE EFFECT
        const groupedAttrLP = state.attrs.filter(
          (attr) => attr.is_list_price_grouped
        );
        if (groupedAttrLP.length > 0)
          state.attr_list_price = cartesianLP(groupedAttrLP, state.list_price);
        else state.attr_list_price = [];
      }
    },
    updateIsEditingAttr: (
      state,
      { payload: { attrIndex } }: PayloadAction<{ attrIndex: number }>
    ) => {
      state.attrs.map((attr, idx) => {
        attr.editing = idx === attrIndex;
        return attr;
      });
    },
    updateGroupedAttr: (
      state,
      {
        payload: { attrChecked, attrId, groupedType },
      }: PayloadAction<{
        attrChecked: boolean;
        attrId: number;
        groupedType: "dc" | "lp";
      }>
    ) => {
      if (groupedType === "dc") {
        state.attrs.forEach((attr) => {
          if (attr.attr.id === attrId)
            attr.is_default_code_grouped = attrChecked;
          else attr.is_default_code_grouped = false;
          return attr;
        });
        // ATTR DEFAULT CODE MAP
        const groupedAttr = state.attrs.filter(
          (attr) => attr.is_default_code_grouped
        );
        if (groupedAttr.length > 0) {
          const newAttrDefaultCode = cartesianDC(groupedAttr);
          state.attr_default_code = newAttrDefaultCode;
        } else {
          state.attr_default_code = [];
        }
      } else if (groupedType === "lp") {
        state.attrs.forEach((attr) => {
          if (attr.attr.id === attrId) attr.is_list_price_grouped = attrChecked;
          else attr.is_list_price_grouped = false;
          return attr;
        });
        // ATTR LIST PRICE MAP
        const groupedAttr = state.attrs.filter(
          (attr) => attr.is_list_price_grouped
        );
        if (groupedAttr.length > 0) {
          const newAttrListPrice = cartesianLP(groupedAttr, state.list_price);
          state.attr_list_price = newAttrListPrice;
        } else {
          state.attr_list_price = [];
        }
      }
    },
    updateAttrDefaultCode: (
      state,
      {
        payload: { defaultCode, attrDefaultCodeIdx },
      }: PayloadAction<{ defaultCode: string; attrDefaultCodeIdx: number }>
    ) => {
      state.attr_default_code.map((attrDc, idx) => {
        if (attrDefaultCodeIdx === idx) attrDc.default_code = defaultCode;
        return attrDc;
      });
    },
    updateAttrListPrice: (
      state,
      {
        payload: { listPrice, attrListPriceIdx },
      }: PayloadAction<{ listPrice: number; attrListPriceIdx: number }>
    ) => {
      state.attr_list_price.map((attrLp, idx) => {
        if (attrListPriceIdx === idx) attrLp.list_price = listPrice;
        return attrLp;
      });
    },
    replaceProduct: (
      state,
      { payload: { product } }: PayloadAction<{ product: ProductProductForm }>
    ) => {
      state.id = product.id;
      state.is_in_list = product.is_in_list;
      state.name = product.name;
      state.list_price = product.list_price;
      state.default_code = product.default_code;
      state.category_line_name = product.category_line_name;
      state.category_line_id = product.category_line_id;
      state.category_family_name = product.category_family_name;
      state.category_family_id = product.category_family_id;
      state.category_brand_name = product.category_brand_name;
      state.category_brand_id = product.category_brand_id;
      state.pos_categ_id = product.pos_categ_id;
      state.pos_categ_name = product.pos_categ_name;
      state.attrs = product.attrs;
      state.attr_default_code = product.attr_default_code;
      state.attr_list_price = product.attr_list_price;
    },
    reset: (state) => {
      state.id = new Date().getTime();
      state.is_in_list = false;
      state.name = "";
      state.list_price = 1;
      state.default_code = "";
      state.category_line_name = "";
      state.category_line_id = 0;
      state.category_family_name = "";
      state.category_family_id = 0;
      state.category_brand_name = "";
      state.category_brand_id = 0;
      state.pos_categ_id = 0;
      state.pos_categ_name = "";
      state.attrs = [];
      state.attr_default_code = [];
      state.attr_list_price = [];
    },
  },
});

export const {
  updateName,
  updateListPrice,
  updateDefaultCode,
  updateLine,
  updateFamily,
  updateBrand,
  updatePosCat,
  updateAttr,
  updateAttrVal,
  addAttr,
  deleteAttr,
  updateIsEditingAttr,
  updateGroupedAttr,
  updateAttrDefaultCode,
  updateAttrListPrice,
  replaceProduct,
  reset,
} = productSlice.actions;

export const selectProduct = (state: RootState) => state.product.product;
export const selectProductId = (state: RootState) => state.product.product.id;
export const selectProductName = (state: RootState) =>
  state.product.product.name;
export const selectProductListPrice = (state: RootState) =>
  state.product.product.list_price;
export const selectProductDefaultCode = (state: RootState) =>
  state.product.product.default_code;
export const selectProductLineId = (state: RootState) =>
  state.product.product.category_line_id;
export const selectProductFamilyId = (state: RootState) =>
  state.product.product.category_family_id;
export const selectProductBrandId = (state: RootState) =>
  state.product.product.category_brand_id;
export const selectProductPosId = (state: RootState) =>
  state.product.product.pos_categ_id;
export const selectProductAttribute = (state: RootState) =>
  state.product.product.attrs;
export const selectProductAttrDefaultCode = (state: RootState) =>
  state.product.product.attr_default_code;
export const selectProductAttrListPrice = (state: RootState) =>
  state.product.product.attr_list_price;

export default productSlice.reducer;
