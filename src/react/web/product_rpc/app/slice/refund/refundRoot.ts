import { combineReducers } from "@reduxjs/toolkit";
import formReducer from "./formSlice";
import invoiceReducer from "./invoiceSlice";

export default combineReducers({
  form: formReducer,
  invoice: invoiceReducer,
});
