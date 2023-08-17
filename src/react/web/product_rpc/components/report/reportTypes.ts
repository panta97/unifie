import { CatalogGeneric } from "../../types/shared";

export interface ReportType extends CatalogGeneric {}

export type DataType = "date" | "text" | "number";

export interface ReportParam {
  id: number;
  name: string;
  display_name: string;
  data_type: DataType;
}
export interface Report {
  id: number;
  name: string;
  params: ReportParam[];
}

export type DynamicReportResult = { [key: string]: any };
