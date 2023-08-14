import React from "react";
import { ReportParamUI } from "../report_types/GenericReport";
import { DatePicker } from "../../shared/datepicker/DatePicker";
import { ParamProps } from "./types";

const DateParam: React.FC<ParamProps> = ({ param, updateReportParam }) => {
  return (
    <div className="inline-flex flex-col w-40 mr-1">
      <label className="text-xs" htmlFor={param.html}>
        {param.html}
      </label>
      <DatePicker
        name={param.html}
        value={param.value}
        updateDate={(date) => {
          updateReportParam(param.id, date);
        }}
      />
    </div>
  );
};

export default DateParam;
