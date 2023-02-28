import React from 'react';
import { useAppSelector } from "../../app/hooks";
import { selectReportState } from "../../app/slice/report/reportSlice";
import { Loader } from "../shared/Loader";
import { ReportForm } from "./ReportForm";

const Report = () => {
  const { status } = useAppSelector(selectReportState);
  return (
    <>
      <ReportForm />
      <Loader fetchStatus={status} portal={true} />
    </>
  );
};

export default Report;
