import React, { useEffect, useState } from "react";
import { DynamicReportResult, Report, ReportParam } from "../reportTypes";
import DateParam from "../params/DateParam";
import NumberParam from "../params/NumberParam";
import TextParam from "../params/TextParam";
import { NoFocusButton } from "../../shared/NoFocusButton";
import { useAppDispatch } from "../../../app/hooks";
import { updateReportStatus } from "../../../app/slice/report/reportSlice";
import { FetchStatus } from "../../../types/fetch";

export interface ReportParamUI extends ReportParam {
  value: string;
}

interface GenericReportProps {
  report: Report;
  setResultList: (resultList: DynamicReportResult[]) => void;
}

const GenericReport: React.FC<GenericReportProps> = ({
  report,
  setResultList,
}) => {
  const dispatch = useAppDispatch();
  const [reportParams, setReportParams] = useState<ReportParamUI[]>([]);

  useEffect(() => {
    setReportParams(
      report.params.map((rp) => ({
        ...rp,
        value: "",
      }))
    );
  }, [report]);

  const handleDownload = async () => {
    try {
      dispatch(updateReportStatus({ status: FetchStatus.LOADING }));
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...report, params: reportParams }),
      };
      const response = await fetch(
        "/api/product-rpc/report/dynamic",
        requestOptions
      );
      const json = (await response.json()) as DynamicReportResult[];
      if (json) {
        setResultList(json);
      }
    } catch (error) {
      console.log(error);
    } finally {
      dispatch(updateReportStatus({ status: FetchStatus.IDLE }));
    }
  };

  const updateReportParam = (id: number, newValue: string) => {
    setReportParams((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          item.value = newValue;
        }
        return item;
      })
    );
  };

  const renderReportParam = (param: ReportParamUI) => {
    switch (param.data_type) {
      case "date":
        return (
          <DateParam
            key={param.id}
            param={param}
            updateReportParam={updateReportParam}
          />
        );
      case "number":
        return (
          <NumberParam
            key={param.id}
            param={param}
            updateReportParam={updateReportParam}
          />
        );
      case "text":
        return (
          <TextParam
            key={param.id}
            param={param}
            updateReportParam={updateReportParam}
          />
        );
    }
  };

  return (
    <div>
      <div>{reportParams.map((rp) => renderReportParam(rp))}</div>
      <div className="flex justify-end pt-2 text-base">
        <NoFocusButton
          onClick={handleDownload}
          className="rounded bg-gray-100 px-2 py-1 cursor-pointer w-24"
        >
          Descargar
        </NoFocusButton>
      </div>
    </div>
  );
};

export default GenericReport;
