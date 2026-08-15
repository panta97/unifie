import React, { useEffect } from "react";
import { Printer } from "lucide-react";
import { InvoiceSummary } from "../../types/refund";
import { useAppDispatch } from "../../app/hooks";
import { setSelectedRefundForPrint } from "../../app/slice/refund/invoiceSlice";

export interface InvoiceSummaryTableProps {
  title: string;
  invoiceSummaries: InvoiceSummary[];
  showPrint?: boolean;
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
}: InvoiceSummaryTableProps) => {
  const dispatch = useAppDispatch();
  const validInvoices = invoiceSummaries.filter(
    (invoice) => invoice !== undefined
  );

  const handlePrint = (refund_invoice: InvoiceSummary) => {
    dispatch(setSelectedRefundForPrint(refund_invoice));
    setTimeout(() => {
      window.print();
    }, 50);
  };

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
              colSpan={showPrint ? 3 : 2}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
