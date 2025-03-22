import React, { Fragment, useEffect } from "react";
import QRCode from "react-qr-code";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectFormIvoiceStatus } from "../../app/slice/refund/formSlice";
import {
  selectInvoiceItem,
  updateRefund,
} from "../../app/slice/refund/creditSlice";
import { Loader } from "../shared/Loader";
import {
  getCurrencyFormat,
  getInvoiceDiscount,
  getInvoiceSummary,
  getQtyFormat,
} from "./format";
import kdoshLogo from "./kdosh_logo.png";

export const InvoiceTicket = () => {
  const invoiceStatus = useAppSelector(selectFormIvoiceStatus);
  const invoiceDetails = useAppSelector(selectInvoiceItem);
  const dispatch = useAppDispatch();

  // useEffect(() => {
  //   console.log("invoiceDetails:", invoiceDetails);
  // }, [invoiceDetails]);

  const handleRefund = (lineId: number, qty: number) => {
    dispatch(updateRefund({ lineId, qty }));
  };

  return (
    <div className="font-invoice text-[13px] text-black">
      <div className="relative inline-block overflow-hidden w-[298px] p-[15px] border border-gray-300 rounded-md min-h-[700px]">
        {invoiceDetails.id !== 0 && (
          <>
            <div className="w-[45%] m-auto">
              <img src={kdoshLogo} alt="Kdosh logo" />
            </div>
            <div className="w-full text-center leading-4">
              JR. ABTAO NRO. 1101 (C.U HUANUCO) , Huanuco, Huanuco, Huanuco
            </div>
            <div className="w-full text-center leading-4">
              Teléfono: 062 517753
            </div>
            <div className="w-full text-center leading-4">
              KDOSH STORE SOCIEDAD ANONIMA CERRADA
            </div>
            <div className="w-full text-center leading-4">
              Ruc: <span className="font-semibold">20542409534</span>
            </div>
            <br />
            <div className="w-full text-center leading-4">
              {invoiceDetails.journal}
            </div>
            <div className="w-full text-center leading-4 font-semibold">
              {invoiceDetails.number}
            </div>
            <div className="w-full text-center leading-4">
              Fecha: {invoiceDetails.create_date}
            </div>
            <br />
            <div className="w-full text-center leading-4">
              moda & accesorios
            </div>
            <br />
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
                {invoiceDetails.lines.map((line) => (
                  <tr
                    key={line.id}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace") handleRefund(line.id, -1);
                      else if (e.key === "Enter") handleRefund(line.id, 1);
                    }}
                  >
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
                  <td className="text-right">
                    {getCurrencyFormat(invoiceDetails.amount_untaxed)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Descuento:</td>
                  <td className="text-right">
                    {getCurrencyFormat(getInvoiceDiscount(invoiceDetails))}
                  </td>
                </tr>
                <tr className="text-[20px]">
                  <td>Total:</td>
                  <td colSpan={2} className="text-right">
                    {getCurrencyFormat(invoiceDetails.amount_total)}
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
            {invoiceDetails.payments.map((payment, idx) => (
              <Fragment key={idx}>
                <div className="flex justify-between leading-[14px]">
                  <span>{`${payment.journal_name} (${invoiceDetails.currency})`}</span>
                  <span>{getCurrencyFormat(payment.amount)}</span>
                </div>
              </Fragment>
            ))}
            <br />
            <div className="flex justify-between">
              <span>Vuelto:</span>
              <span>S/ 0.00</span>
            </div>
            <br />
            <br />
            <div className="flex justify-center">
              <QRCode
                value={getInvoiceSummary(invoiceDetails)}
                size={150}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>
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
                Representación impresa de la boleta o factura electrónica.
                Consulte su comprobante en: WWW.KDOSHSTORE.COM Autorizado
                mediante resolución de oficina zonal Nº
                192-005-0000020/SUNAT.BIENES TRANSFERIDOS EN LA AMAZONIA PARA
                SER CONSUMIDOS EN LA MISMA. Todo cambio de mercadería se hará
                dentro de los 7 días previa presentación del comprobante y
                verificación por parte del dependiente. Además la prenda debe
                estar en buen estado, sin señal de uso y con todas las etiquetas
                puestas. No se aceptan devoluciones de artículos para el hogar,
                maquillaje, bisutería, accesorios varios, ropa intima, vestido
                de fiesta, trajes de baño, carteras y cualquier producto que en
                el momento de su compra este sujeto a alguna promoción o
                descuento. Esta limitación es sin prejuicio de los derechos
                legales del consumidos.
              </span>
            </div>
          </>
        )}
        <Loader fetchStatus={invoiceStatus} portal={false} />
      </div>
    </div>
  );
};
