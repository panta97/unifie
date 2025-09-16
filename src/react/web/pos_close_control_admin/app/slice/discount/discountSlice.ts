import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { discountState } from "./discountType";

const initialState: discountState = {
  price: 0,
  discountedPrice: 0,
  percentage: 0,
};

export const DiscountSlice = createSlice({
  name: "discount",
  initialState,
  reducers: {
    updatePrice: (
      state,
      { payload: { price } }: PayloadAction<{ price: number }>
    ) => {
      state.price = price;
      state.percentage = (state.price - state.discountedPrice) / state.price;
    },
    updateDiscountedPrice: (
      state,
      {
        payload: { discountedPrice },
      }: PayloadAction<{ discountedPrice: number }>
    ) => {
      state.discountedPrice = discountedPrice;
      state.percentage = (state.price - state.discountedPrice) / state.price;
    },
  },
});

export const { updatePrice, updateDiscountedPrice } = DiscountSlice.actions;

export const selectDiscount = (state: RootState) => state.discount;

export default DiscountSlice.reducer;
