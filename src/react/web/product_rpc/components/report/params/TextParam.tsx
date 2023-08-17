import React from "react";
import { ParamProps } from "./types";

const TextParam: React.FC<ParamProps> = ({
  param,
  updateReportParam: setReportParams,
}) => {
  return (
    <div className="inline-flex flex-col w-40 mr-1">
      <label className="text-xs" htmlFor={param.name}>
        {param.display_name}
      </label>
      <input
        id={param.name}
        name={param.name}
        type="text"
        className="border border-gray-300 rounded text-sm px-1"
        value={param.value}
        onChange={(e) => {
          setReportParams(param.id, e.target.value);
        }}
      />
    </div>
  );
};

export default TextParam;
