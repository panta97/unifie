import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectReportState,
  updateReportType,
} from "../../app/slice/report/reportSlice";
import { Select } from "../shared/Select";
import { Wrapper } from "../shared/Wrapper";
import { DynamicReportResult, Report, ReportType } from "./reportTypes";
import { CPEReport } from "./report_types/CPEReport";
import { EQReport } from "./report_types/EQReport";
import { FCReport } from "./report_types/FCReport";
import { DKReport } from "./report_types/DKReport";
import GenericReport from "./report_types/GenericReport";
import ReportResult from "./ReportResult";

// fixed report types will have a negative id
export const reportTypesFixed: ReportType[] = [
  { id: -1, name: "CPE - VENTAS" },
  { id: -2, name: "EQ - METAS" },
  { id: -3, name: "FC - FACTURAS" },
  { id: -4, name: "INV - OLYMPO" },
];

interface ReportFormProps {
  reportList: Report[];
}

export const ReportForm: React.FC<ReportFormProps> = ({ reportList }) => {
  const report = useAppSelector(selectReportState);
  const [resultList, setResultList] = useState<DynamicReportResult[]>([]);
  const dispatch = useAppDispatch();
  const reportTypes = [
    ...reportTypesFixed,
    ...reportList.map((item) => ({
      id: item.id,
      name: item.name,
    })),
  ];

  const handleReportType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reportTypeId = Number(e.target.value);
    dispatch(updateReportType({ reportTypeId, reportTypes }));
    setResultList([]);
  };

  const renderReportType = (reportType: ReportType) => {
    switch (reportType.id) {
      case -1:
        return <CPEReport />;
      case -2:
        return <EQReport />;
      case -3:
        return <FCReport />;
      case -4:
        return <DKReport />;
      default: {
        const report = reportList.find((r) => r.id === reportType.id);
        if (report) {
          return (
            <Wrapper>
              <GenericReport report={report} setResultList={setResultList} />
            </Wrapper>
          );
        } else {
          return <div></div>;
        }
      }
    }
  };

  return (
    <>
      <Wrapper>
        <div className="inline-flex flex-col w-48 mr-1">
          <label htmlFor="report_type" className="text-xs">
            Tipo
          </label>
          <Select
            id={report.reportType.id}
            handler={handleReportType}
            catalog={reportTypes}
            name="report_type"
            autoFocus={false}
          />
        </div>
      </Wrapper>
      {renderReportType(report.reportType)}
      <ReportResult resultList={resultList} />
    </>
  );
};
