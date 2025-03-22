import { combineReducers } from "@reduxjs/toolkit";
import formReducer from "./formSlice";
import invoiceReducer from "./invoiceSlice";
import creditReducer from "./creditSlice";

export default combineReducers({
  form: formReducer,
  invoice: invoiceReducer,
  refundInvoice: creditReducer,
});
