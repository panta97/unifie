import { InvoiceDetails } from "../../types/refund";

export const getCurrencyFormat = (n?: number) => `S/ ${(n ?? 0).toFixed(2)}`;
export const getQtyFormat = (n?: number) => `${(n ?? 0).toFixed(3)}`;

export const getInvoiceSummary = (invoice: InvoiceDetails): string => {
  const ruc = 20542409534;
  const type = invoice.journal_sunat_type;
  const [serie, number] = invoice.number.split("-");
  const amount = invoice.amount_total ? invoice.amount_total.toFixed(2) : "0.00";
  const date = invoice.date_invoice;
  const companyId = 1;
  const partnerDoc = invoice.partner.doc_number;
  return `${ruc}|${type}|${serie}|${number}|0.0|0.0|${amount}|${date}|${companyId}|${partnerDoc}`;
};

export const getInvoiceDiscount = (invoice: InvoiceDetails): number => {
  return invoice.lines.reduce(
    (acc, line) =>
      (acc += (line.discount / 100) * line.price_unit * line.quantity),
    0
  );
};
