import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { endStates } from "../../../data/data";
import { fixNumber } from "../../../utils";
import { RootState } from "../../store";
import { Employee } from "../employee/employeeType";
import {
  ECardDenom,
  ECashDenom,
  endStateType,
  POSFetchResult,
  POSSaveResult,
  POSState,
} from "./posType";

export const FIXED_BALANCE_START = 300;

const initialState: POSState = {
  posName: "",
  cashier: { id: 0, first_name: "", last_name: "" },
  manager: { id: 0, first_name: "", last_name: "" },
  summary: {
    odooCash: 0,
    odooCard: 0,
    odooCreditNote: 0,
    posCash: 0,
    posCard: 0,
    profitTotal: 0,
    balanceStart: 0,
    balanceStartNextDay: 0,
    sessionId: 0,
    sessionName: "",
    startAt: "",
    stopAt: "",
    isSessionClosed: false,
  },
  endState: {
    state: "stable",
    amount: 0,
    note: "",
  },
  cashDenominations: {
    d0_10: 0,
    d0_20: 0,
    d0_50: 0,
    d1_00: 0,
    d2_00: 0,
    d5_00: 0,
    d10_00: 0,
    d20_00: 0,
    d50_00: 0,
    d100_00: 0,
    d200_00: 0,
    dolar: 0,
  },
  cardDenominations: {
    pos1: 0,
    pos2: 0,
    miscellaneous: 0,
  },
  discounts: [],
  fetchPOSStateStatus: "idle",
  savePOSStateStatus: "idle",
  isPOSStateSaved: false,
};

export const fetchPOSDetails = createAsyncThunk(
  "POS/fetchDetails",
  async (
    { sessionId }: { sessionId: string },
    { rejectWithValue }
  ): Promise<POSFetchResult> => {
    try {
      const url = `/api/pos-close-control/get-pos-details/${sessionId}`;
      const response = await fetch(url);
      const jsonResult = await response.json();
      return jsonResult.body;
    } catch (error) {
      throw rejectWithValue(error);
    }
  }
);

export const savePOSDetails = createAsyncThunk(
  "POS/saveDetails",
  async (
    { posState }: { posState: POSState },
    { rejectWithValue }
  ): Promise<POSSaveResult> => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(posState),
    };
    const url = "/api/pos-close-control/pos-persists/";
    try {
      const response = await fetch(url, options);
      const jsonResult = await response.json();
      if (response.status === 500) throw rejectWithValue(jsonResult.msg);
      return jsonResult;
    } catch (error) {
      throw rejectWithValue(error);
    }
  }
);

export const POSSlice = createSlice({
  name: "POS",
  initialState,
  reducers: {
    updateCashDenom: (
      state,
      {
        payload: { denom, amount },
      }: PayloadAction<{ denom: ECashDenom; amount: number }>
    ) => {
      switch (denom) {
        case ECashDenom.d0_10:
          state.cashDenominations.d0_10 = amount;
          break;
        case ECashDenom.d0_20:
          state.cashDenominations.d0_20 = amount;
          break;
        case ECashDenom.d0_50:
          state.cashDenominations.d0_50 = amount;
          break;
        case ECashDenom.d1_00:
          state.cashDenominations.d1_00 = amount;
          break;
        case ECashDenom.d2_00:
          state.cashDenominations.d2_00 = amount;
          break;
        case ECashDenom.d5_00:
          state.cashDenominations.d5_00 = amount;
          break;
        case ECashDenom.d10_00:
          state.cashDenominations.d10_00 = amount;
          break;
        case ECashDenom.d20_00:
          state.cashDenominations.d20_00 = amount;
          break;
        case ECashDenom.d50_00:
          state.cashDenominations.d50_00 = amount;
          break;
        case ECashDenom.d100_00:
          state.cashDenominations.d100_00 = amount;
          break;
        case ECashDenom.d200_00:
          state.cashDenominations.d200_00 = amount;
          break;
      }

      let posCash = 0;
      posCash += state.cashDenominations.d0_10 * 0.1;
      posCash += state.cashDenominations.d0_20 * 0.2;
      posCash += state.cashDenominations.d0_50 * 0.5;
      posCash += state.cashDenominations.d1_00;
      posCash += state.cashDenominations.d2_00 * 2;
      posCash += state.cashDenominations.d5_00 * 5;
      posCash += state.cashDenominations.d10_00 * 10;
      posCash += state.cashDenominations.d20_00 * 20;
      posCash += state.cashDenominations.d50_00 * 50;
      posCash += state.cashDenominations.d100_00 * 100;
      posCash += state.cashDenominations.d200_00 * 200;
      state.summary.posCash = fixNumber(posCash);

      let profitTotal = -FIXED_BALANCE_START;
      profitTotal += state.cashDenominations.d0_10 * 0.1;
      profitTotal += state.cashDenominations.d0_20 * 0.2;
      profitTotal += state.cashDenominations.d0_50 * 0.5;
      profitTotal += state.cashDenominations.d1_00;
      profitTotal += state.cashDenominations.d2_00 * 2;
      profitTotal += state.cashDenominations.d5_00 * 5;
      profitTotal += state.cashDenominations.d10_00 * 10;
      profitTotal += state.cashDenominations.d20_00 * 20;
      // profitTotal += Math.max(state.cashDenominations.d20_00 - 20, 0) * 20;
      profitTotal += state.cashDenominations.d50_00 * 50;
      profitTotal += state.cashDenominations.d100_00 * 100;
      profitTotal += state.cashDenominations.d200_00 * 200;
      state.summary.profitTotal = fixNumber(profitTotal);

      // bsnd = balance start next day
      let bsnd = FIXED_BALANCE_START;
      // bsnd += state.cashDenominations.d0_10 * 0.1;
      // bsnd += state.cashDenominations.d0_20 * 0.2;
      // bsnd += state.cashDenominations.d0_50 * 0.5;
      // bsnd += state.cashDenominations.d1_00;
      // bsnd += state.cashDenominations.d2_00 * 2;
      // bsnd += state.cashDenominations.d5_00 * 5;
      // bsnd += Math.min(state.cashDenominations.d10_00, 60) * 10;
      // bsnd += Math.min(state.cashDenominations.d20_00, 20) * 20;
      // bsnd += Math.min(state.cashDenominations.d100_00, 6) * 100;
      state.summary.balanceStartNextDay = fixNumber(bsnd);
    },
    updateCardDenom: (
      state,
      {
        payload: { denom, amount },
      }: PayloadAction<{ denom: ECardDenom; amount: number }>
    ) => {
      switch (denom) {
        case ECardDenom.pos1:
          state.cardDenominations.pos1 = amount;
          break;
        case ECardDenom.pos2:
          state.cardDenominations.pos2 = amount;
          break;
        case ECardDenom.miscellaneous:
          state.cardDenominations.miscellaneous = amount;
          break;
      }
      let posCard = 0;
      posCard += state.cardDenominations.pos1;
      posCard += state.cardDenominations.pos2;
      posCard += state.cardDenominations.miscellaneous;
      state.summary.posCard = fixNumber(posCard);
    },
    updatePos: (
      state,
      { payload: { pos } }: PayloadAction<{ pos: string }>
    ) => {
      state.posName = pos;
    },
    updateCashier: (
      state,
      { payload: { cashier } }: PayloadAction<{ cashier: Employee }>
    ) => {
      state.cashier = cashier;
    },
    updateManager: (
      state,
      { payload: { manager } }: PayloadAction<{ manager: Employee }>
    ) => {
      state.manager = manager;
    },
    updateOdooSummary: (
      state,
      {
        payload: {
          odooCash,
          odooCard,
          balanceStart,
          sessionName,
          startAt,
          stopAt,
        },
      }: PayloadAction<{
        odooCash: number;
        odooCard: number;
        balanceStart: number;
        sessionName: string;
        startAt: string;
        stopAt: string;
      }>
    ) => {
      state.summary.odooCash = odooCash;
      state.summary.odooCard = odooCard;
      state.summary.balanceStart = balanceStart;
      state.summary.sessionName = sessionName;
      state.summary.startAt = startAt;
      state.summary.stopAt = stopAt;
    },
    updateEndState: (
      state,
      {
        payload: { endState, amount, note },
      }: PayloadAction<{ endState?: string; amount?: number; note?: string }>
    ) => {
      if (
        endState !== undefined &&
        endStates.includes(endState as endStateType)
      ) {
        state.endState.state = endState as endStateType;
        if (endState === "stable") state.endState.amount = 0;
      }
      if (amount !== undefined) state.endState.amount = amount;
      if (note !== undefined) state.endState.note = note;
    },
    setFetchStatusesToIdle: (state) => {
      state.fetchPOSStateStatus = "idle";
      state.savePOSStateStatus = "idle";
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchPOSDetails.pending, (state) => {
      state.fetchPOSStateStatus = "loading";
    });

    builder.addCase(fetchPOSDetails.fulfilled, (state, action) => {
      const posDetails = action.payload;
      state.fetchPOSStateStatus = "idle";

      if (!posDetails.is_session_closed) state.isPOSStateSaved = false;
      if (state.summary.sessionId !== posDetails.session_id) {
        state.endState.state = "stable";
        state.endState.amount = 0;
        state.endState.note = "";
      }

      state.posName = posDetails.pos_name;
      state.summary.sessionId = posDetails.session_id;
      state.summary.sessionName = posDetails.session_name;
      state.summary.balanceStart = posDetails.balance_start;
      state.summary.startAt = posDetails.start_at;
      state.summary.stopAt = posDetails.stop_at;
      state.summary.odooCash = posDetails.cash;
      state.summary.odooCard = posDetails.card;
      state.summary.odooCreditNote = posDetails.credit_note;
      state.summary.isSessionClosed = posDetails.is_session_closed;

      state.discounts = [];
      for (let i = 0; i < posDetails.discounts.length; i++) {
        const discount = posDetails.discounts[i];
        state.discounts.push({
          discount: discount.discount,
          invoiceNumber: discount.invoice_number,
          productDesc: discount.product_desc,
          invoiceId: discount.invoice_id,
          odooLink: discount.odoo_link,
        });
      }
    });

    builder.addCase(fetchPOSDetails.rejected, (state) => {
      state.fetchPOSStateStatus = "idle";
    });

    builder.addCase(savePOSDetails.pending, (state) => {
      state.savePOSStateStatus = "loading";
    });
    builder.addCase(savePOSDetails.fulfilled, (state) => {
      state.savePOSStateStatus = "idle";
      state.isPOSStateSaved = true;
      alert("CUADRE GUARDADO");
    });
    builder.addCase(savePOSDetails.rejected, (state, action) => {
      state.savePOSStateStatus = "idle";
      alert((action.payload as any).payload);
    });
  },
});

export const {
  updateCashDenom,
  updateCardDenom,
  updatePos,
  updateCashier,
  updateManager,
  updateOdooSummary,
  updateEndState,
  setFetchStatusesToIdle,
} = POSSlice.actions;

export const selectPosName = (state: RootState) => state.pos.posName;
export const selectCashier = (state: RootState) => state.pos.cashier;
export const selectManager = (state: RootState) => state.pos.manager;
export const selectSummary = (state: RootState) => state.pos.summary;
export const selectCashDenominations = (state: RootState) =>
  state.pos.cashDenominations;
export const selectCardDenominations = (state: RootState) =>
  state.pos.cardDenominations;

export default POSSlice.reducer;
