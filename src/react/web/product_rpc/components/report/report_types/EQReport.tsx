import React, { useState } from "react";
import { DatePicker } from "../../shared/datepicker/DatePicker";
import { Wrapper } from "../../shared/Wrapper";
import { Switch } from "../../shared/Switch";
import {
  getDateDiff,
  getSheetFilename,
  getTodayDate,
} from "../../../utils/utils";
import { saveAs } from "file-saver";
import { useAppDispatch } from "../../../app/hooks";
import { updateReportStatus } from "../../../app/slice/report/reportSlice";
import { fetchResult, FetchStatus } from "../../../types/fetch";
import { NoFocusButton } from "../../shared/NoFocusButton";

export const EQReport = () => {
  const dispatch = useAppDispatch();
  const [dateFrom, setDateFrom] = useState(getTodayDate());
  const [dateTo, setDateTo] = useState(getTodayDate());
  const [store, setStore] = useState("AB");

  const handleDownload = async () => {
    const dateDiff = getDateDiff(dateFrom, dateTo);
    if (dateDiff < 0) {
      alert("Fecha desde <= Fecha hasta");
      return;
    }

    try {
      dispatch(updateReportStatus({ status: FetchStatus.LOADING }));
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store,
          date_from: dateFrom,
          date_to: dateTo,
        }),
      };
      const response = await fetch(
        "/api/product-rpc/report/eq",
        requestOptions
      );
      if (
        response.headers.get("Content-Type") ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        const blob = await response.blob();
        saveAs(blob, getSheetFilename(response.headers));
      } else {
        const json = await response.json();
        if (json.result === fetchResult.ERROR) throw new Error(json.message);
      }
    } catch (error) {
      alert(error);
    } finally {
      dispatch(updateReportStatus({ status: FetchStatus.IDLE }));
    }
  };

  return (
    <Wrapper>
      <div className="text-xs">
        <div className="inline-flex flex-col w-40 mr-1">
          <label htmlFor="date_from">Desde</label>
          <DatePicker
            name={"date_from"}
            value={dateFrom}
            updateDate={(date) => setDateFrom(date)}
          />
        </div>
        <div className="inline-flex flex-col w-40 mr-1">
          <label htmlFor="date_to">Hasta</label>
          <DatePicker
            name={"date_to"}
            value={dateTo}
            updateDate={(date) => setDateTo(date)}
          />
        </div>
        <div className="inline-flex flex-col w-[280px] mr-1">
          <label htmlFor="company">Tienda</label>
          <div
            className="flex items-center justify-between"
            style={{ height: "22px" }}
          >
            <div className="flex items-center">
              <Switch
                id="abtao-store"
                checked={store === "AB"}
                onChange={() => setStore("AB")}
              />
              <label>ABTAO</label>
            </div>
            <div className="flex items-center">
              <Switch
                id="sanmartin-store"
                checked={store === "SM"}
                onChange={() => setStore("SM")}
              />
              <label>SAN MARTIN</label>
            </div>
            <div className="flex items-center">
              <Switch
                id="tingo-store"
                checked={store === "TG"}
                onChange={() => setStore("TG")}
              />
              <label>TINGO</label>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2 text-base">
          <NoFocusButton
            onClick={handleDownload}
            className="rounded bg-gray-100 px-2 py-1 cursor-pointer w-24"
          >
            Descargar
          </NoFocusButton>
        </div>
      </div>
    </Wrapper>
  );
};
