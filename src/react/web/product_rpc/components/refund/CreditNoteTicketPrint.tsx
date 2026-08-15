import React from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";
import { useAppSelector } from "../../app/hooks";
import {
  selectInvoiceItem,
  selectSelectedRefundForPrint,
} from "../../app/slice/refund/invoiceSlice";
import { getCurrencyFormat, getQtyFormat } from "./format";
import kdoshLogo from "./kdosh_logo.png";

interface PrintLineItem {
  id: number;
  name: string;
  quantity: number;
  discount: number;
  price_unit: number;
  price_subtotal: number;
}

export const CreditNoteTicketPrint = () => {
  const invoiceDetails = useAppSelector(selectInvoiceItem);
  const selectedRefund = useAppSelector(selectSelectedRefundForPrint);

  // La nota de crédito seleccionada para imprimir, o por defecto la última creada/existente
  const targetRefund =
    selectedRefund ??
    (invoiceDetails.refund_invoices.length > 0
      ? invoiceDetails.refund_invoices[invoiceDetails.refund_invoices.length - 1]
      : null);

  // Determinar líneas de la nota de crédito
  let refundLines: PrintLineItem[] = [];
  if (targetRefund?.lines && targetRefund.lines.length > 0) {
    refundLines = targetRefund.lines.map((l) => ({
      id: l.id,
      name: l.name,
      quantity: l.quantity,
      discount: l.discount ?? 0,
      price_unit: l.price_unit,
      price_subtotal: l.price_subtotal,
    }));
  } else if (invoiceDetails.lines.some((line) => line.qty_refund > 0)) {
    refundLines = invoiceDetails.lines
      .filter((line) => line.qty_refund > 0)
      .map((line) => ({
        id: line.id,
        name: line.name,
        quantity: line.qty_refund,
        discount: line.discount ?? 0,
        price_unit:
          line.price_unit_refund > 0 ? line.price_unit_refund : line.price_unit,
        price_subtotal:
          line.price_subtotal_refund > 0
            ? line.price_subtotal_refund
            : line.qty_refund *
              (line.price_unit_refund > 0
                ? line.price_unit_refund
                : line.price_unit),
      }));
  } else if (
    invoiceDetails.lines.some(
      (line) =>
        (line.qty_refunded !== undefined && line.qty_refunded > 0) ||
        line.is_refunded
    )
  ) {
    refundLines = invoiceDetails.lines
      .filter(
        (line) =>
          (line.qty_refunded !== undefined && line.qty_refunded > 0) ||
          line.is_refunded
      )
      .map((line) => {
        const qty =
          line.qty_refunded !== undefined && line.qty_refunded > 0
            ? line.qty_refunded
            : line.quantity;
        return {
          id: line.id,
          name: line.name,
          quantity: qty,
          discount: line.discount ?? 0,
          price_unit: line.price_unit,
          price_subtotal:
            line.price_subtotal > 0
              ? line.price_subtotal
              : qty * line.price_unit,
        };
      });
  }

  const totalRefund =
    targetRefund?.amount_total !== undefined && targetRefund.amount_total > 0
      ? targetRefund.amount_total
      : refundLines.reduce((curr, line) => curr + line.price_subtotal, 0);

  const subtotalRefund =
    targetRefund?.amount_untaxed !== undefined && targetRefund.amount_untaxed > 0
      ? targetRefund.amount_untaxed
      : totalRefund;

  // Determinar tipo de comprobante para el QR (07 = Nota de Crédito)
  const ruc = 20542409534;
  const journalSunatType = "07";
  const refundNumber = targetRefund?.number ?? "";
  const cleanNumber = refundNumber.replace(/\s+/g, "");
  const parts = cleanNumber.split("-");
  const serie = parts[0] ?? "";
  const numPart = parts[1] ?? "";
  const dateStr =
    targetRefund?.create_date?.split(" ")?.[0] ?? invoiceDetails.date_invoice;
  const partnerDoc = invoiceDetails.partner.doc_number;
  const qrValue = `${ruc}|${journalSunatType}|${serie}|${numPart}|0.0|0.0|${totalRefund.toFixed(
    2
  )}|${dateStr}|1|${partnerDoc}`;

  // Determinar etiqueta del comprobante
  const getJournalLabel = () => {
    if (targetRefund?.journal) return targetRefund.journal;
    const num = targetRefund?.number?.toUpperCase() ?? "";
    if (num.startsWith("B")) return "Nota de Crédito Boleta Electrónica";
    if (num.startsWith("F")) return "Nota de Crédito Factura Electrónica";
    if (invoiceDetails.journal) {
      const j = invoiceDetails.journal.toLowerCase();
      if (j.includes("factura")) return "Nota de Crédito Factura Electrónica";
      if (j.includes("boleta")) return "Nota de Crédito Boleta Electrónica";
    }
    return "Nota de Crédito Electrónica";
  };

  if (!targetRefund || invoiceDetails.id === 0) return null;

  return createPortal(
    <div className="font-invoice text-[13px] text-black">
      <div className="relative inline-block overflow-hidden w-[296px] p-[15px] min-h-[700px]">
        {/* Logo */}
        <div className="w-[45%] m-auto">
          <img src={kdoshLogo} alt="Kdosh logo" />
        </div>

        {/* Datos empresa */}
        <div className="w-full text-center leading-4">
          JR. ABTAO NRO. 1101 (C.U HUANUCO) , Huanuco, Huanuco, Huanuco
        </div>
        <div className="w-full text-center leading-4">Teléfono: 062 517753</div>
        <div className="w-full text-center leading-4">
          KDOSH STORE SOCIEDAD ANONIMA CERRADA
        </div>
        <div className="w-full text-center leading-4">
          Ruc: <span className="font-semibold">20542409534</span>
        </div>
        <br />

        {/* Tipo comprobante y número de nota de crédito */}
        <div className="w-full text-center leading-4">{getJournalLabel()}</div>
        <div className="w-full text-center leading-4 font-semibold">
          {targetRefund.number}
        </div>
        <div className="w-full text-center leading-4">
          Fecha: {targetRefund.create_date}
        </div>
        <br />

        <div className="w-full text-center leading-4">moda &amp; accesorios</div>
        <br />

        {/* Tabla de productos devueltos */}
        <table className="leading-[13px]">
          <thead>
            <tr className="border border-black">
              <th className="w-[40%] text-left">Producto</th>
              <th className="w-[20%] text-center">Cant.</th>
              <th className="w-[20%] text-center">Unit</th>
              <th className="w-[20%] text-center">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {refundLines.map((line) => (
              <tr key={line.id}>
                <td className="p-0">
                  {line.name}
                  {line.discount !== 0 && (
                    <div className="text-[12px] italic">{`Con un ${line.discount}% descuento`}</div>
                  )}
                </td>
                <td className="p-0 text-center">
                  {getQtyFormat(line.quantity)}
                </td>
                <td className="p-0 text-right">
                  {getCurrencyFormat(line.price_unit)}
                </td>
                <td className="p-0 text-right">
                  {getCurrencyFormat(line.price_subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <br />

        {/* Totales */}
        <table className="w-full leading-[14px]">
          <colgroup>
            <col width="40%" />
            <col width="30%" />
            <col width="30%" />
          </colgroup>
          <tbody>
            <tr>
              <td></td>
              <td>Subtotal:</td>
              <td className="text-right">{getCurrencyFormat(subtotalRefund)}</td>
            </tr>
            <tr>
              <td></td>
              <td>Descuento:</td>
              <td className="text-right">{getCurrencyFormat(0)}</td>
            </tr>
            <tr className="text-[20px]">
              <td>Total:</td>
              <td colSpan={2} className="text-right">
                {getCurrencyFormat(totalRefund)}
              </td>
            </tr>
          </tbody>
        </table>
        <br />

        {/* Vuelto */}
        <div className="flex justify-between">
          <span>Vuelto:</span>
          <span>S/ 0.00</span>
        </div>
        <br />
        <br />

        {/* QR Code */}
        <div className="flex justify-center">
          <QRCode
            value={qrValue}
            size={150}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
          />
        </div>

        {/* Datos del cliente */}
        <div className="py-[20px] flex flex-col leading-[13px]">
          <span>Usuario: {invoiceDetails.user}</span>
          <span>
            Cliente:{" "}
            <a
              tabIndex={-1}
              className="cursor-pointer hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              href={invoiceDetails.partner.odoo_link}
            >
              {invoiceDetails.partner.name}
            </a>
          </span>
          <span>
            Número de doc.:{" "}
            <span className="font-semibold">
              {invoiceDetails.partner.doc_number}
            </span>
          </span>
          <br />
          <br />
          <span>=========================================</span>
          <br />
          <span className="text-center font-semibold">
            Representación impresa de la boleta o factura electrónica. Consulte
            su comprobante en: WWW.KDOSHSTORE.COM Autorizado mediante resolución
            de oficina zonal Nº 192-005-0000020/SUNAT.BIENES TRANSFERIDOS EN LA
            AMAZONIA PARA SER CONSUMIDOS EN LA MISMA. Todo cambio de mercadería
            se hará dentro de los 7 días previa presentación del comprobante y
            verificación por parte del dependiente. Además la prenda debe estar
            en buen estado, sin señal de uso y con todas las etiquetas puestas.
            No se aceptan devoluciones de artículos para el hogar, maquillaje,
            bisutería, accesorios varios, ropa intima, vestido de fiesta, trajes
            de baño, carteras y cualquier producto que en el momento de su compra
            este sujeto a alguna promoción o descuento. Esta limitación es sin
            prejuicio de los derechos legales del consumidos.
          </span>
        </div>
      </div>
    </div>,
    document.getElementById("print")!
  );
};
