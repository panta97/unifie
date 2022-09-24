import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FetchStatus } from "../../../types/fetch";
import { ProductFormState } from "../../../types/product";
import { RootState } from "../../store";

export type FormState = {
  formState: ProductFormState;
  status: FetchStatus;
};

const initialState: FormState = {
  formState: ProductFormState.DRAF,
  status: FetchStatus.IDLE,
};

export const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {
    updateFormState: (
      state,
      { payload: { formState } }: PayloadAction<{ formState: ProductFormState }>
    ) => {
      state.formState = formState;
    },
    updateFormStatus: (
      state,
      { payload: { status } }: PayloadAction<{ status: FetchStatus }>
    ) => {
      state.status = status;
    },
  },
});

export const { updateFormState, updateFormStatus } = formSlice.actions;

export const selectFormState = (state: RootState) => state.product.form;

export default formSlice.reducer;
