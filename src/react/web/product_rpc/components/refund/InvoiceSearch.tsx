import React, { useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { updateInvoiceStatus } from "../../app/slice/refund/formSlice";
import { replaceInvoice } from "../../app/slice/refund/invoiceSlice";
import { fetchResult, FetchStatus } from "../../types/fetch";
import { InvoiceTicket } from "./InvoiceTicket";

const getInvoiceFromQR = (qr: string) => {
  let separator: string | RegExp = "";
  if (
    /^\d+\|\d{2}\|\w\d{3}\|\d{8}\|0\.0\|0\.0\|\d+\.\d{2}\|\d{4}-\d{2}-\d{2}\|\d\|(\d{8}|\d{11})$/i.test(
      qr
    )
  ) {
    separator = "|";
  } else if (
    /^\d+Ç\d{2}Ç\w\d{3}Ç\d{8}Ç0\.0Ç0\.0Ç\d+\.\d{2}Ç\d{4}'\d{2}'\d{2}Ç\dÇ(\d{8}|\d{11})$/i.test(
      qr
    )
  ) {
    separator = /Ç/i;
  } else return;

  const qrParts = qr.split(separator);
  const serie = qrParts[2];
  const number = qrParts[3];
  return `${serie}-${number}`.toUpperCase();
};

export const InvoiceSearch = () => {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const dispatch = useAppDispatch();

  const handleInvoiceNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceNumber(e.target.value);
  };

  const handleFindInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      dispatch(updateInvoiceStatus({ invoiceStatus: FetchStatus.LOADING }));
      const params = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
      };
      let invoiceNumberSearch = invoiceNumber;
      const invoiceNumberQR = getInvoiceFromQR(invoiceNumberSearch);
      if (invoiceNumberQR) {
        invoiceNumberSearch = invoiceNumberQR;
        setInvoiceNumber(invoiceNumberSearch);
      }
      const response = await fetch(
        `/api/product-rpc/refund/invoice?number=${invoiceNumberSearch}`,
        params
      );
      const json = await response.json();
      if (json.result === fetchResult.SUCCESS) {
        dispatch(replaceInvoice({ invoice: json.invoice_details }));
        setInvoiceNumber("");
      } else {
        alert(json.message);
      }
    } catch (error) {
      alert(error);
    } finally {
      dispatch(updateInvoiceStatus({ invoiceStatus: FetchStatus.IDLE }));
    }
  };

  return (
    <div>
      <form className="flex gap-2 items-end mb-2" onSubmit={handleFindInvoice}>
        <div className="inline-flex flex-col w-40">
          <label htmlFor="invoice_number" className="text-xs">
            Número de Factura
            <input
              className="border border-gray-300 rounded text-sm px-1 w-[150px]"
              type="text"
              autoComplete="off"
              spellCheck={false}
              id="invoice_number"
              name="invoice_number"
              value={invoiceNumber}
              onFocus={(e) => e.target.select()}
              onChange={handleInvoiceNumber}
            />
          </label>
        </div>
        <button className="rounded bg-gray-100 px-3 py-1 cursor-pointer text-xs border border-gray-700 leading-3">
          Buscar
        </button>
      </form>
      <InvoiceTicket />
    </div>
  );
};
