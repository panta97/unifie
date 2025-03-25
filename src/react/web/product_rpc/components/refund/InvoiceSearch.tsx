import React, { useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { updateInvoiceStatus } from "../../app/slice/refund/formSlice";
import { replaceInvoice } from "../../app/slice/refund/invoiceSlice";
import { fetchResult, FetchStatus } from "../../types/fetch";
import { InvoiceTicket } from "./InvoiceTicket";
import { BlockInventory } from "./selectBlockInventory";

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

interface InvoiceSearchProps {
  isPaying: boolean;
  setIsPaying: React.Dispatch<React.SetStateAction<boolean>>;
}

export const InvoiceSearch: React.FC<InvoiceSearchProps> = ({ isPaying, setIsPaying }) => {
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

      const accion = isPaying ? "pagar" : "no_pagar";
      console.log("Acción enviada:", accion);

      const response = await fetch(
        `/api/product-rpc/refund/invoice?number=${invoiceNumberSearch}&accion=${accion}`,
        params
      );

      const json = await response.json();
      if (json.result === fetchResult.SUCCESS) {
        dispatch(replaceInvoice({ invoice: json.invoice_details }));
        setInvoiceNumber("");
      } else {
        alert("Esta boleta/factura ya tiene una nota de crédito. " + json.message);
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
        <div className="flex items-center gap-2">
          {!isPaying && <span className="text-xs w-[50px]">No pagar</span>}

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPaying}
              onChange={(e) => setIsPaying(e.target.checked)}
              className="sr-only peer"
            />
            <div
              className={`w-10 h-5 rounded-full transition-all relative ${isPaying ? "bg-green-500" : "bg-red-500"
                }`}
            >
              <div
                className={`absolute w-4 h-4 bg-white rounded-full transition-all 
          ${isPaying ? "left-[23px]" : "left-[1px]"} top-1/2 -translate-y-1/2`}
              ></div>
            </div>
          </label>

          {isPaying && <span className="text-xs">Pagar</span>}
        </div>
      </form>
      <BlockInventory />
      <br />
      <InvoiceTicket />
    </div>
  );
};