import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ItemTableType } from "../../../components/purchase_order/order_item/attr/OrderItemAttr";
import { AttributeVal } from "../../../types/attribute";
import { OrderItem, ProductItem } from "../../../types/purchaseOrder";
import { reorder } from "../../../utils/utils";
import { RootState } from "../../store";

export type OrderItemState = OrderItem;

const initialState: OrderItemState = {
  odoo_link: "",
  is_in_list: false,
  id: 0,
  name: "",
  date: "",
  product_matrix: [],
};

export const orderItemSlice = createSlice({
  name: "orderItem",
  initialState,
  reducers: {
    updateProductQty: (
      state,
      { payload }: PayloadAction<{ productId: number; qty: number }>
    ) => {
      state.product_matrix.forEach((productRow) => {
        productRow.product_items.forEach((productItem) => {
          if (productItem.id === payload.productId)
            productItem.qty = payload.qty;
        });
      });
    },
    updateProductPrice: (
      state,
      { payload }: PayloadAction<{ productId: number; price: number }>
    ) => {
      state.product_matrix.forEach((productRow) => {
        productRow.product_items.forEach((productItem) => {
          if (productItem.id === payload.productId)
            productItem.price = payload.price;
        });
      });
    },
    replaceItem: (
      state,
      { payload }: PayloadAction<{ orderItem: OrderItem }>
    ) => {
      const { orderItem } = payload;
      state.odoo_link = orderItem.odoo_link;
      state.is_in_list = orderItem.is_in_list;
      state.id = orderItem.id;
      state.name = orderItem.name;
      state.date = orderItem.date;
      state.product_matrix = orderItem.product_matrix;
      state.attr_rows = orderItem.attr_rows;
      state.attr_cols = orderItem.attr_cols;
    },
    deleteAttrRow: (
      state,
      { payload }: PayloadAction<{ attrRowId: number }>
    ) => {
      if (!state.attr_rows) return;
      if (state.attr_rows.attr_vals.length < 2) return;
      const attrIdx = state.attr_rows.attr_vals.findIndex(
        (attrRow) => attrRow.id === payload.attrRowId
      );
      const rowIdx = state.product_matrix.findIndex(
        (productRow) => productRow.id === payload.attrRowId
      );
      if (attrIdx > -1 && rowIdx > -1) {
        state.attr_rows.attr_vals.splice(attrIdx, 1);
        state.product_matrix.splice(rowIdx, 1);
      }
    },
    deleteAttrCol: (
      state,
      { payload }: PayloadAction<{ attrColId: number }>
    ) => {
      if (!state.attr_cols) return;
      if (state.attr_cols.attr_vals.length < 2) return;
      const attrIdx = state.attr_cols.attr_vals.findIndex(
        (attrCol) => attrCol.id === payload.attrColId
      );
      let colIdx = 0;
      for (let i = 0; i < state.product_matrix.length; i++) {
        const productRow = state.product_matrix[i];
        colIdx = productRow.product_items.findIndex((productItem) =>
          productItem.attrs.some((attr) => attr === payload.attrColId)
        );
        if (colIdx > 1) break;
      }
      if (attrIdx > -1 && colIdx > -1) {
        state.attr_cols.attr_vals.splice(attrIdx, 1);
        state.product_matrix.forEach((productRow) => {
          productRow.product_items.splice(colIdx, 1);
        });
      }
    },
    reorderRows: (
      state,
      { payload }: PayloadAction<{ sourceIndex: number; destIndex: number }>
    ) => {
      if (!state.attr_rows) return;
      state.attr_rows.attr_vals = reorder(
        state.attr_rows.attr_vals,
        payload.sourceIndex,
        payload.destIndex
      );
      state.product_matrix = reorder(
        state.product_matrix,
        payload.sourceIndex,
        payload.destIndex
      );
    },
    reorderCols: (
      state,
      {
        payload: { attributeVals },
      }: PayloadAction<{ attributeVals: AttributeVal[] }>
    ) => {
      if (!state.attr_cols) return;
      const attributeValsFiltered = attributeVals.filter((attr) =>
        state.attr_cols?.attr_vals.some((attrCol) => attrCol.id === attr.id)
      );
      state.attr_cols.attr_vals.sort((attrA, attrB) => {
        // attribute sort A
        const attrSA = attributeValsFiltered.find(
          (attr) => attr.id === attrA.id
        )!;
        const attrSB = attributeValsFiltered.find(
          (attr) => attr.id === attrB.id
        )!;
        const sortA = attrSA?.sort ? attrSA.sort : attrSA?.id;
        const sortB = attrSB?.sort ? attrSB.sort : attrSB?.id;
        return sortA - sortB;
      });
      for (const productRow of state.product_matrix)
        productRow.product_items.sort((piA, piB) => {
          const attrA = attributeValsFiltered.find((attrA) =>
            piA.attrs.some((attr) => attr === attrA.id)
          )!;
          const attrB = attributeValsFiltered.find((attrB) =>
            piB.attrs.some((attr) => attr === attrB.id)
          )!;
          const sortA = attrA.sort ? attrA.sort : attrA.id;
          const sortB = attrB.sort ? attrB.sort : attrB.id;
          return sortA - sortB;
        });
    },
    resetOrderItem: (state) => {
      state.is_in_list = false;
      state.id = 0;
      state.name = "";
      state.date = "";
      state.product_matrix = [];
      if (state.attr_rows) state.attr_rows = undefined;
      if (state.attr_cols) state.attr_cols = undefined;
    },
    fillProductItemValue: (
      state,
      {
        payload: { productItem, type, posX, posY, dir },
      }: PayloadAction<{
        productItem: ProductItem;
        type: ItemTableType;
        posX: number;
        posY: number;
        dir: "up" | "down" | "left" | "right";
      }>
    ) => {
      let shouldFill: (i: number, j: number) => boolean;
      switch (dir) {
        case "up":
          shouldFill = (i, j) => i < posX && j === posY;
          break;
        case "down":
          shouldFill = (i, j) => i > posX && j === posY;
          break;
        case "left":
          shouldFill = (i, j) => i === posX && j < posY;
          break;
        case "right":
          shouldFill = (i, j) => i === posX && j > posY;
          break;
      }

      const loopProdItems = (
        shouldFill: (i: number, j: number) => boolean,
        updateValue: (i: number, j: number) => void
      ) => {
        for (let i = 0; i < state.product_matrix.length; i++)
          for (let j = 0; j < state.product_matrix[i].product_items.length; j++)
            if (shouldFill(i, j)) updateValue(i, j);
      };

      if (type === ItemTableType.PRICE)
        loopProdItems(
          shouldFill,
          (i, j) =>
            (state.product_matrix[i].product_items[j].price = productItem.price)
        );

      if (type === ItemTableType.QTY)
        loopProdItems(
          shouldFill,
          (i, j) =>
            (state.product_matrix[i].product_items[j].qty = productItem.qty)
        );
    },
    fillProductItemValueAll: (
      state,
      {
        payload: { type, posX, posY, dir },
      }: PayloadAction<{
        type: ItemTableType;
        posX: number;
        posY: number;
        dir: "up" | "down" | "left" | "right";
      }>
    ) => {
      let shouldFill: (i: number, j: number) => boolean;
      switch (dir) {
        case "up":
          shouldFill = (i, j) => i < posX;
          break;
        case "down":
          shouldFill = (i, j) => i > posX;
          break;
        case "left":
          shouldFill = (i, j) => j < posY;
          break;
        case "right":
          shouldFill = (i, j) => j > posY;
          break;
      }

      const loopProdItems = (
        shouldFill: (i: number, j: number) => boolean,
        updateValue: (i: number, j: number, x: number, y: number) => void
      ) => {
        for (let i = 0; i < state.product_matrix.length; i++)
          for (let j = 0; j < state.product_matrix[i].product_items.length; j++)
            if (shouldFill(i, j)) {
              const x = dir === "left" || dir === "right" ? i : posX;
              const y = dir === "up" || dir === "down" ? j : posY;
              updateValue(i, j, x, y);
            }
      };

      if (type === ItemTableType.PRICE)
        loopProdItems(
          shouldFill,
          (i, j, x, y) =>
            (state.product_matrix[i].product_items[j].price =
              state.product_matrix[x].product_items[y].price)
        );

      if (type === ItemTableType.QTY)
        loopProdItems(
          shouldFill,
          (i, j, x, y) =>
            (state.product_matrix[i].product_items[j].qty =
              state.product_matrix[x].product_items[y].qty)
        );
    },
  },
});

export const {
  updateProductQty,
  updateProductPrice,
  replaceItem,
  deleteAttrRow,
  deleteAttrCol,
  reorderRows,
  reorderCols,
  resetOrderItem,
  fillProductItemValue,
  fillProductItemValueAll,
} = orderItemSlice.actions;

export const selectOrderItem = (state: RootState) => state.order.orderItem;
export const selectOrderItemId = (state: RootState) => state.order.orderItem.id;

export default orderItemSlice.reducer;
