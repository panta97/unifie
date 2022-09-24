import { combineReducers } from "@reduxjs/toolkit";
import catalogReducer from "./catalogSlice";
import formReducer from "./formSlice";
import orderDetailsReducer from "./orderDetailsSlice";
import orderItemReducer from "./orderItemSlice";
import orderListReducer from "./orderListSlice";

export default combineReducers({
  orderItem: orderItemReducer,
  orderList: orderListReducer,
  form: formReducer,
  orderDetails: orderDetailsReducer,
  catalog: catalogReducer,
});
