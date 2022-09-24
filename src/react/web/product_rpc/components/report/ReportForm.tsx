import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectReportState,
  updateReportType,
} from "../../app/slice/report/reportSlice";
import { Select } from "../shared/Select";
import { Wrapper } from "../shared/Wrapper";
import { ReportType, reportTypes } from "./reportTypes";
import { CPEReport } from "./report_types/CPEReport";
import { EQReport } from "./report_types/EQReport";
import { FCReport } from "./report_types/FCReport";
import { DKReport } from "./report_types/DKReport";

export const ReportForm = () => {
  const report = useAppSelector(selectReportState);
  const dispatch = useAppDispatch();

  const handleReportType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reportTypeId = Number(e.target.value);
    dispatch(updateReportType({ reportTypeId, reportTypes }));
  };

  const renderReportType = (reportType: ReportType) => {
    switch (reportType.id) {
      case 1:
        return <CPEReport />;
      case 2:
        return <EQReport />;
      case 3:
        return <FCReport />;
      case 4:
        return <DKReport />;
      default:
        return <div></div>;
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
    </>
  );
};
