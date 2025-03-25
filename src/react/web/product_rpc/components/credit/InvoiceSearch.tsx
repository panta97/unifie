import React, { useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { updateInvoiceStatus } from "../../app/slice/refund/formSlice";
import { replaceInvoice } from "../../app/slice/refund/invoiceSlice";
import { fetchResult, FetchStatus } from "../../types/fetch";
import { InvoiceTicket } from "./InvoiceTicket";
import { BotonPago } from "./BotonPago";

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
  const [notFound, setNotFound] = useState(false);
  const [creditNoteStatus, setCreditNoteStatus] = useState<string | null>(null);
  const [creditNoteId, setCreditNoteId] = useState<number | null>(null);
  const dispatch = useAppDispatch();

  const handleFindInvoice = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    try {
      dispatch(updateInvoiceStatus({ invoiceStatus: FetchStatus.LOADING }));
      setNotFound(false);
      setCreditNoteStatus(null);

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
        `/api/product-rpc/credit-note/invoice?number=${invoiceNumberSearch}`,
        params
      );
      const json = await response.json();
      // console.log("API Response:", json);

      if (json.result === fetchResult.SUCCESS && json.credit_note_details) {
        dispatch(replaceInvoice({ invoice: json.credit_note_details }));
        setCreditNoteStatus(json.credit_note_details.payment_state);
        setInvoiceNumber("");

        if (json.credit_note_details.id) {
          setCreditNoteId(Number(json.credit_note_details.id));
        } else {
          console.warn("⚠️ El ID de la nota de crédito no está presente en la respuesta.");
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error en la búsqueda de la factura:", error);
      alert("Error en la búsqueda de la factura: " + error);
    } finally {
      dispatch(updateInvoiceStatus({ invoiceStatus: FetchStatus.IDLE }));
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "in_payment":
      case "paid":
        return "text-green-600 bg-green-200";
      case "not_paid":
        return "text-red-600 bg-red-200";
      case "pending":
        return "text-yellow-600 bg-yellow-200";
      default:
        return "text-gray-600 bg-gray-200";
    }
  };

  const translateStatus = (status: string | null) => {
    switch (status) {
      case "not_paid":
        return "No pagado";
      case "in_payment":
        return "En proceso de pago";
      case "paid":
        return "Pagado";
      case "partial":
        return "Pago parcial";
      case "reversed":
        return "Revertido";
      case "invoicing_error":
        return "Error en facturación";
      case "invoicing_pending":
        return "Facturación pendiente";
      default:
        return "Desconocido";
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
              onChange={(e) => {
                setInvoiceNumber(e.target.value);
                setNotFound(false);
              }}
            />
          </label>
        </div>
        <button className="rounded bg-gray-100 px-3 py-1 cursor-pointer text-xs border border-gray-700 leading-3">
          Buscar
        </button>
      </form>

      {notFound && (
        <div className="mt-2 text-sm text-red-600">
          No se encontró una nota de crédito con ese número.
        </div>
      )}

      {!notFound && (
        <div className="flex flex-col items-center gap-2 mt-5">
          <div className="flex items-start gap-4 mt-5">
            <div className="flex flex-col items-center gap-2">
              {creditNoteStatus && (
                <span className={`px-3 py-2 rounded text-sm font-semibold ${getStatusColor(creditNoteStatus)}`}>
                  {translateStatus(creditNoteStatus)}
                </span>
              )}
              <InvoiceTicket />
            </div>
            {creditNoteStatus === "not_paid" && creditNoteId && (
              <BotonPago creditNoteId={creditNoteId} fetchUpdatedInvoice={handleFindInvoice} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
