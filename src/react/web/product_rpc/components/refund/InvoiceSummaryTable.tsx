import React from 'react';
import { InvoiceSummary } from "../../types/refund";

export interface InvoiceSummaryTableProps {
  title: string;
  invoiceSummaries: InvoiceSummary[];
}

export const InvoiceSummaryTable = ({
  title,
  invoiceSummaries,
}: InvoiceSummaryTableProps) => {
  return (
    <div>
      <table className="w-[298px]">
        <thead>
          <tr>
            <th className="border border-gray-300 text-left px-1" colSpan={2}>
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
          </tr>
        </thead>
        <tbody>
          {invoiceSummaries.map((invoice) => (
            <tr key={invoice.id}>
              <td className="border border-gray-300 px-1">
                <a
                  className="inline-flex items-center cursor-pointer hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={invoice.odoo_link}
                >
                  {invoice.number}
                </a>
              </td>
              <td className="border border-gray-300 px-1">
                {invoice.create_date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
