import { combineReducers } from "@reduxjs/toolkit";
import catalogReducer from "./catalogSlice";
import formReducer from "./formSlice";
import productListReducer from "./productListSlice";
import productReducer from "./productSlice";

export default combineReducers({
  product: productReducer,
  productList: productListReducer,
  catalog: catalogReducer,
  form: formReducer,
});
