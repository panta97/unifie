import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import orderReducer from "./slice/order/orderRoot";
import productReducer from "./slice/product/productRoot";
import refundReducer from "./slice/refund/refundRoot";
import reportReducer from "./slice/report/reportSlice";

const store = configureStore({
  reducer: {
    order: orderReducer,
    product: productReducer,
    report: reportReducer,
    refund: refundReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
ReturnType,
RootState,
unknown,
Action<string>
>;
export default store;
