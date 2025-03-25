import { combineReducers } from "@reduxjs/toolkit";
import formReducer from "./formSlice";
import creditReducer from "./creditSlice";

export default combineReducers({
  form: formReducer,
  refundInvoice: creditReducer,
});
