import React from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";
import { useAppSelector } from "../../app/hooks";
import { selectInvoiceItem } from "../../app/slice/refund/creditSlice";
import {
  getCurrencyFormat,
  getQtyFormat,
} from "./format";
import kdoshLogo from "./kdosh_logo.png";

export const CreditNoteTicketPrint = () => {
  const invoiceDetails = useAppSelector(selectInvoiceItem);

  // La última nota de crédito creada
  const lastRefund =
    invoiceDetails.refund_invoices.length > 0
      ? invoiceDetails.refund_invoices[invoiceDetails.refund_invoices.length - 1]
      : null;

  // Productos que se devolvieron: si hay selección activa, tomar qty_refund > 0;
  // si no (se está reimprimiendo una existente), tomar las líneas ya devueltas (qty_refunded > 0 o is_refunded)
  const activeRefundLines = invoiceDetails.lines.filter((line) => line.qty_refund > 0);
  const refundLines =
    activeRefundLines.length > 0
      ? activeRefundLines
      : invoiceDetails.lines.filter(
          (line) =>
            (line.qty_refunded !== undefined && line.qty_refunded > 0) ||
            line.is_refunded
        );

  const getLineQty = (line: typeof invoiceDetails.lines[0]) =>
    line.qty_refund > 0
      ? line.qty_refund
      : line.qty_refunded && line.qty_refunded > 0
      ? line.qty_refunded
      : line.quantity;

  const getLinePriceUnit = (line: typeof invoiceDetails.lines[0]) =>
    line.price_unit_refund > 0 ? line.price_unit_refund : line.price_unit;

  const getLineSubtotal = (line: typeof invoiceDetails.lines[0]) =>
    line.price_subtotal_refund > 0
      ? line.price_subtotal_refund
      : getLineQty(line) * getLinePriceUnit(line);

  const totalRefund = refundLines.reduce(
    (curr, line) => curr + getLineSubtotal(line),
    0
  );

  // Determinar tipo de comprobante para el QR
  const ruc = 20542409534;
  const journalSunatType = invoiceDetails.journal_sunat_type;
  const refundNumber = lastRefund?.number ?? "";
  const parts = refundNumber.split("-");
  const serie = parts[0] ?? "";
  const numPart = parts[1] ?? "";
  const dateStr = lastRefund?.create_date?.split(" ")?.[0] ?? invoiceDetails.date_invoice;
  const partnerDoc = invoiceDetails.partner.doc_number;
  const qrValue = `${ruc}|${journalSunatType}|${serie}|${numPart}|0.0|0.0|${totalRefund.toFixed(2)}|${dateStr}|1|${partnerDoc}`;

  // Determinar etiqueta del comprobante
  const getJournalLabel = () => {
    if (!invoiceDetails.journal) return "Nota de Crédito Electrónica";
    const j = invoiceDetails.journal.toLowerCase();
    if (j.includes("factura")) return "Nota de Crédito Factura Electrónica";
    if (j.includes("boleta")) return "Nota de Crédito Boleta Electrónica";
    return "Nota de Crédito Electrónica";
  };

  if (!lastRefund || invoiceDetails.id === 0) return null;

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
          {lastRefund.number}
        </div>
        <div className="w-full text-center leading-4">
          Fecha: {lastRefund.create_date}
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
                  {getQtyFormat(getLineQty(line))}
                </td>
                <td className="p-0 text-right">
                  {getCurrencyFormat(getLinePriceUnit(line))}
                </td>
                <td className="p-0 text-right">
                  {getCurrencyFormat(getLineSubtotal(line))}
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
              <td className="text-right">{getCurrencyFormat(totalRefund)}</td>
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
            <span className="font-semibold">{invoiceDetails.partner.doc_number}</span>
          </span>
          <br />
          <br />
          <span>=========================================</span>
          <br />
          <span className="text-center font-semibold">
            Representación impresa de la boleta o factura electrónica. Consulte su
            comprobante en: WWW.KDOSHSTORE.COM Autorizado mediante resolución de
            oficina zonal Nº 192-005-0000020/SUNAT.BIENES TRANSFERIDOS EN LA
            AMAZONIA PARA SER CONSUMIDOS EN LA MISMA. Todo cambio de mercadería se
            hará dentro de los 7 días previa presentación del comprobante y
            verificación por parte del dependiente. Además la prenda debe estar en
            buen estado, sin señal de uso y con todas las etiquetas puestas. No se
            aceptan devoluciones de artículos para el hogar, maquillaje, bisutería,
            accesorios varios, ropa intima, vestido de fiesta, trajes de baño,
            carteras y cualquier producto que en el momento de su compra este sujeto
            a alguna promoción o descuento. Esta limitación es sin prejuicio de los
            derechos legales del consumidos.
          </span>
        </div>
      </div>
    </div>,
    document.getElementById("print")!
  );
};
