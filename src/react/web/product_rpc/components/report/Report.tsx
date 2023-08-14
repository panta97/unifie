import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectReportState } from "../../app/slice/report/reportSlice";
import { Loader } from "../shared/Loader";
import { ReportForm } from "./ReportForm";
import { Report as ReportType } from "./reportTypes";

const Report = () => {
  const { status } = useAppSelector(selectReportState);
  const [reportList, setReportList] = useState<ReportType[]>([]);

  const handleFetchReportList = async () => {
    const response = await fetch("/api/product-rpc/reports");
    const json = (await response.json()) as ReportType[];
    setReportList(json);
  };

  useEffect(() => {
    handleFetchReportList();
  }, []);

  return (
    <>
      <ReportForm reportList={reportList} />
      <Loader fetchStatus={status} portal={true} />
    </>
  );
};

export default Report;
