import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { securityState } from "./securityType";

const initialState: securityState = {
  isLocked: true,
  lockedSince: 0,
};

export const SecuritySlice = createSlice({
  name: "security",
  initialState,
  reducers: {
    updateSecurity: (
      state,
      {
        payload: { isLocked, lockedSince },
      }: PayloadAction<{ isLocked: boolean; lockedSince: number }>
    ) => {
      state.isLocked = isLocked;
      state.lockedSince = lockedSince;
    },
  },
});

export const { updateSecurity } = SecuritySlice.actions;

export const selectIsLocked = (state: RootState) => state.security.isLocked;
export const selectLockedSince = (state: RootState) =>
  state.security.lockedSince;

export default SecuritySlice.reducer;
