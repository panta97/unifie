import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReportType } from "../../../components/report/reportTypes";
import { FetchStatus } from "../../../types/fetch";
import { RootState } from "../../store";

export type ReportState = {
  reportType: ReportType;
  status: FetchStatus;
};

const initialState: ReportState = {
  reportType: { id: 0, name: "Seleccione" },
  status: FetchStatus.IDLE,
};

export const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    updateReportType: (
      state,
      {
        payload: { reportTypeId, reportTypes },
      }: PayloadAction<{ reportTypeId: number; reportTypes: ReportType[] }>
    ) => {
      const newReportType = reportTypes.find((rt) => rt.id === reportTypeId);
      if (newReportType) state.reportType = newReportType;
    },
    updateReportStatus: (
      state,
      { payload: { status } }: PayloadAction<{ status: FetchStatus }>
    ) => {
      state.status = status;
    },
  },
});

export const { updateReportType, updateReportStatus } = reportSlice.actions;

export const selectReportState = (state: RootState) => state.report;

export default reportSlice.reducer;
