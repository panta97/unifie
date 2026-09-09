import React, { useState } from "react";
import { Check, Copy, Printer } from "lucide-react";
import { InvoiceSummary } from "../../types/refund";
import { useAppDispatch } from "../../app/hooks";
import { setSelectedRefundForPrint } from "../../app/slice/refund/invoiceSlice";

export interface InvoiceSummaryTableProps {
  title: string;
  invoiceSummaries: InvoiceSummary[];
  showPrint?: boolean;
  showCopy?: boolean;
}

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return "";
  // Si ya viene formateada como DD/MM/YYYY ...
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    return dateStr;
  }
  // Si viene en UTC crudo de Odoo: YYYY-MM-DD HH:mm:ss
  const match = dateStr.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/
  );
  if (match) {
    const [, year, month, day, hours, minutes, seconds] = match;
    const utcDate = new Date(
      Date.UTC(+year, +month - 1, +day, +hours, +minutes, +seconds)
    );
    const peruTime = new Date(utcDate.getTime() - 5 * 60 * 60 * 1000);
    const d = String(peruTime.getUTCDate()).padStart(2, "0");
    const m = String(peruTime.getUTCMonth() + 1).padStart(2, "0");
    const y = peruTime.getUTCFullYear();
    const h = String(peruTime.getUTCHours()).padStart(2, "0");
    const min = String(peruTime.getUTCMinutes()).padStart(2, "0");
    return `${d}/${m}/${y} ${h}:${min}`;
  }
  return dateStr;
};

export const InvoiceSummaryTable = ({
  title,
  invoiceSummaries,
  showPrint = false,
  showCopy = false,
}: InvoiceSummaryTableProps) => {
  const dispatch = useAppDispatch();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const validInvoices = invoiceSummaries.filter(
    (invoice) => invoice !== undefined
  );

  const handlePrint = (refund_invoice: InvoiceSummary) => {
    dispatch(setSelectedRefundForPrint(refund_invoice));
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        dispatch(setSelectedRefundForPrint(null));
      }, 500);
    }, 50);
  };

  const handleCopy = async (refundInvoice: InvoiceSummary) => {
    try {
      await navigator.clipboard.writeText(refundInvoice.number);
      setCopiedId(refundInvoice.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      const input = document.createElement("textarea");
      input.value = refundInvoice.number;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedId(refundInvoice.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const actionColumns = Number(showPrint) + Number(showCopy);

  if (validInvoices.length === 0) {
    return null;
  }

  return (
    <div>
      <table className="w-[298px]">
        <thead>
          <tr>
            <th
              className="border border-gray-300 font-invoice text-left px-1"
              colSpan={2 + actionColumns}
            >
              {title}
            </th>
          </tr>
          <tr>
            <th className="border border-gray-300 text-left px-1 font-normal">
              Número
            </th>
            <th className="border border-gray-300 text-left px-1 font-normal">
              Fecha
            </th>
            {showPrint && (
              <th className="border border-gray-300 text-center px-1 font-normal">
                &nbsp;
              </th>
            )}
            {showCopy && (
              <th className="border border-gray-300 text-center px-1 font-normal">
                Acción
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {validInvoices.map((refund_invoice) => (
            <tr key={refund_invoice.id}>
              <td className="border border-gray-300 px-1">
                <a
                  className="inline-flex items-center cursor-pointer hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={refund_invoice.odoo_link ?? "#"}
                >
                  {refund_invoice.number}
                </a>
              </td>
              <td className="border border-gray-300 px-1 whitespace-nowrap">
                {formatDisplayDate(refund_invoice.create_date)}
              </td>
              {showPrint && (
                <td className="border border-gray-300 px-2 py-0.5 text-center">
                  <button
                    title="Imprimir nota de crédito"
                    onClick={() => handlePrint(refund_invoice)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-sans cursor-pointer hover:underline"
                  >
                    <Printer size={13} />
                    <span>Imprimir</span>
                  </button>
                </td>
              )}
              {showCopy && (
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <button
                    title="Copiar número de nota de crédito"
                    onClick={() => handleCopy(refund_invoice)}
                    className="inline-flex items-center gap-1.5 rounded border border-green-600 px-2 py-1 text-sm text-green-700 hover:bg-green-50 hover:text-green-900 font-sans cursor-pointer"
                  >
                    {copiedId === refund_invoice.id ? (
                      <Check size={15} />
                    ) : (
                      <Copy size={15} />
                    )}
                    <span>{copiedId === refund_invoice.id ? "Copiado" : "Copiar"}</span>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
