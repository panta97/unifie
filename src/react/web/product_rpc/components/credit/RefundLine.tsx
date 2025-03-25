import React, { useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Trash2 } from "lucide-react";
import {
  selectFormRefundStatus,
  updateRefundStatus,
} from "../../app/slice/refund/formSlice";
import {
  selectInvoiceItem,
  updateRefundEditing,
  updateRefundManual,
  updateRefundResult,
} from "../../app/slice/refund/creditSlice";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { fetchResult, FetchStatus } from "../../types/fetch";
import { Loader } from "../shared/Loader";
import { getCurrencyFormat, getQtyFormat } from "./format";
import { InvoiceSummaryTable } from "./InvoiceSummaryTable";
import { linesSchema } from "./validation";

export const RefundLine = () => {
  const refundStatus = useAppSelector(selectFormRefundStatus);
  const invoiceDetails = useAppSelector(selectInvoiceItem);
  const tableSectionRef = useRef<HTMLTableSectionElement>(null);
  const dispatch = useAppDispatch();

  useOnClickOutside(tableSectionRef, () =>
    dispatch(updateRefundEditing({ lineId: 0, isEditing: false }))
  );

  const handleEditRefund = (lineId: number, isEditing: boolean) => {
    dispatch(updateRefundEditing({ lineId, isEditing }));
  };

  const handleUpdateRefundSubtotal = (
    e: React.ChangeEvent<HTMLInputElement>,
    lineId: number
  ) => {
    let priceSubtotalRefund = Math.max(0, e.target.valueAsNumber);
    if (isNaN(priceSubtotalRefund)) priceSubtotalRefund = 0;
    dispatch(updateRefundManual({ lineId, priceSubtotalRefund }));
  };

  const handleRemoveProduct = (lineId: number) => {
    dispatch(updateRefundManual({ lineId, priceSubtotalRefund: 0, remove: true }));
  };

  const handleCreateRefund = async () => {
    const selectedLines = invoiceDetails.lines.filter(
      (line) => line.qty_refund > 0
    );

    if (selectedLines.length === 0) {
      alert("Debe seleccionar al menos un producto");
      return;
    }

    if (invoiceDetails.has_refund) {
      const isConfirmed = window.confirm(
        "Esta factura ya tiene nota(s) de crédito,\n ¿está seguro que quiere crear uno nuevo?"
      );
      if (!isConfirmed) return;
    }

    try {
      await linesSchema.validate(
        invoiceDetails.lines.filter((line) => line.qty_refund > 0)
      );
      dispatch(updateRefundStatus({ refundStatus: FetchStatus.LOADING }));
      const params = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          invoice_details: {
            ...invoiceDetails,
            lines: selectedLines,
          },
          // Se elimina stock_location ya que no se utiliza en este flujo
        }),
      };
      console.log("Datos enviados en el body:", params.body);
      const response = await fetch(`/api/product-rpc/refund/create`, params);
      const json = await response.json();
      if (json.result === fetchResult.SUCCESS) {
        dispatch(
          updateRefundResult({
            refund_invoice: json.refund_invoice,
            stock_move: json.stock_move,
          })
        );
      } else {
        alert(json.message);
      }
    } catch (error) {
      dispatch(updateRefundStatus({ refundStatus: FetchStatus.IDLE }));
      alert(error);
    } finally {
      dispatch(updateRefundStatus({ refundStatus: FetchStatus.IDLE }));
    }
  };

  return (
    <div className="relative">
      <div className="absolute text-sm space-y-2 mt-[46px]">
        {invoiceDetails.refund_invoices.length > 0 && (
          <InvoiceSummaryTable
            title="Nota de Crédito"
            invoiceSummaries={invoiceDetails.refund_invoices}
          />
        )}
        {invoiceDetails.stock_moves.length > 0 && (
          <InvoiceSummaryTable
            title="Inventario"
            invoiceSummaries={invoiceDetails.stock_moves}
          />
        )}
      </div>
      <div className="mt-[368px]">
        <div className="w-[298px] p-[15px] text-[13px] text-black border border-gray-300 rounded-md font-invoice">
          <table className="leading-[13px]">
            <thead>
              <tr className="border border-black">
                <th className="w-[40%] text-left">Producto</th>
                <th className="w-[20%] text-center">Cant.</th>
                <th className="w-[20%] text-center">Unit</th>
                <th className="w-[20%] text-center">Subtotal</th>
                <th className="w-[20%] text-center">Acción</th>
              </tr>
            </thead>
            <tbody ref={tableSectionRef}>
              {invoiceDetails.lines
                .filter((line) => line.qty_refund > 0)
                .map((line) => (
                  <tr
                    key={line.id}
                    onClick={() => handleEditRefund(line.id, true)}
                    className="hover:bg-gray-200 hover:cursor-pointer"
                  >
                    <td className="p-0">
                      {line.name}
                      {line.discount !== 0 && (
                        <div className="text-[12px] italic">{`Con un ${line.discount}% descuento`}</div>
                      )}
                    </td>
                    <td className="p-0 text-center">
                      {getQtyFormat(line.qty_refund)}
                    </td>
                    <td className="p-0 text-right">
                      {getCurrencyFormat(line.price_unit_refund)}
                    </td>
                    <td className="p-0 text-right">
                      {line.is_editing_refund ? (
                        <input
                          value={line.price_subtotal_refund}
                          onChange={(e) =>
                            handleUpdateRefundSubtotal(e, line.id)
                          }
                          autoFocus
                          className="border border-black w-[45px]"
                          type="number"
                        />
                      ) : (
                        getCurrencyFormat(line.price_subtotal_refund)
                      )}
                    </td>
                    <td className="p-0 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProduct(line.id);
                        }}
                        className="text-black hover:text-black"
                      >
                        <Trash2 size={16} />
                      </button>
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
              <tr className="text-[20px]">
                <td>Total:</td>
                <td colSpan={2} className="text-right">
                  {getCurrencyFormat(
                    invoiceDetails.lines.reduce(
                      (curr, line) => curr + line.price_subtotal_refund,
                      0
                    )
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-center mt-2">
          <button
            className="rounded bg-gray-100 px-2 py-1 cursor-pointer font-sans text-base border border-gray-700"
            onClick={handleCreateRefund}
          >
            Crear nota de crédito
          </button>
        </div>
      </div>
      <Loader fetchStatus={refundStatus} portal={true} />
    </div>
  );
};

export default RefundLine;
