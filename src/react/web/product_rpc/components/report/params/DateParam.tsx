import React from "react";
import { DatePicker } from "../../shared/datepicker/DatePicker";
import { ParamProps } from "./types";

const DateParam: React.FC<ParamProps> = ({ param, updateReportParam }) => {
  return (
    <div className="inline-flex flex-col w-40 mr-1">
      <label className="text-xs" htmlFor={param.name}>
        {param.display_name}
      </label>
      <DatePicker
        name={param.name}
        updateDate={(date) => {
          updateReportParam(param.id, date);
        }}
      />
    </div>
  );
};

export default DateParam;
