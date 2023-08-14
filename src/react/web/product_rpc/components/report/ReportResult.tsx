import React from "react";
import { Wrapper } from "../shared/Wrapper";
import { DynamicReportResult } from "./reportTypes";

interface ReportResultProps {
  resultList: DynamicReportResult[];
}

const ReportResult: React.FC<ReportResultProps> = ({ resultList }) => {
  if (resultList.length === 0) return null;
  return (
    <Wrapper>
      <div className="text-xs border border-gray-200 mb-2 overflow-hidden rounded-md font-mono">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100 text-gray-500">
              {Object.keys(resultList[0]).map((key, idx) => (
                <th
                  key={key + idx}
                  className="text-left border-r last:border-r-0 font-normal p-1"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="border-b-2 border-gray-200 last:border-0">
            {resultList.map((r, idx) => (
              <tr
                key={idx}
                className="border-b last:border-b-0 border-gray-200 text-gray-700"
              >
                {Object.values(r).map((val, valIdx) => (
                  <td
                    key={valIdx}
                    className="text-left border-r last:border-r-0 font-normal p-1"
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Wrapper>
  );
};

export default ReportResult;
