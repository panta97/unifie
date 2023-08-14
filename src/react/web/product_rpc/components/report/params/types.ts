import { ReportParamUI } from "../report_types/GenericReport";

export interface ParamProps {
  param: ReportParamUI;
  updateReportParam: (id: number, newValue: string) => void;
}
