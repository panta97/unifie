import { useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectFormRefundStatus,
  updateRefundStatus,
} from "../../app/slice/refund/formSlice";
import {
  selectInvoiceItem,
  updateRefundEditing,
  updateRefundManual,
  updateRefundResult,
} from "../../app/slice/refund/invoiceSlice";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { fetchResult, FetchStatus } from "../../types/fetch";
import { StockLocation } from "../../types/refund";
import { Loader } from "../shared/Loader";
import { Select } from "../shared/Select";
import { getCurrencyFormat, getQtyFormat } from "./format";
import { InvoiceSummaryTable } from "./InvoiceSummaryTable";
import { linesSchema } from "./validation";

// TODO: this list should not be hardcoded
const stockLocations: StockLocation[] = [
  {
    id: 1,
    name: "ABTAO - KD01/ALMACEN/TIENDA",
    parent_location_id: 11,
    original_location_id: 30,
  },
  {
    id: 2,
    name: "SAN MARTIN - KD02/TIENDA",
    parent_location_id: 18,
    original_location_id: 19,
  },
];

export const RefundLine = () => {
  const { storedValue: stockLocation, setValue: setStockLocation } =
    useLocalStorage<StockLocation>("r-state-stock-location", stockLocations[0]);
  const refundStatus = useAppSelector(selectFormRefundStatus);
  const invoiceDetails = useAppSelector(selectInvoiceItem);
  const tableSectionRef = useRef<HTMLTableSectionElement>(null);
  useOnClickOutside(tableSectionRef, () =>
    dispatch(updateRefundEditing({ lineId: 0, isEditing: false }))
  );
  const dispatch = useAppDispatch();

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

  const handleCreateRefund = async () => {
    if (!invoiceDetails.lines.some((line) => line.qty_refund > 0)) {
      alert("Debe seleccionar al menos un producto");
      return;
    }

    if (invoiceDetails.has_refund) {
      const isConfirmed = window.confirm(
        "Esta factura ya tiene nota(s) de crédito,\n está seguro que quiere crear uno nuevo?"
      );
      if (!isConfirmed) return;
    }

    if (stockLocation.id === 0) {
      alert("Debe elegir un almacen destino");
      return;
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
          invoice_details: invoiceDetails,
          stock_location: stockLocation,
        }),
      };
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

  const handleUpdateStockLocation = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedStock = stockLocations.find(
      (stock) => stock.id === Number(e.target.value)
    );
    if (!selectedStock) {
      setStockLocation({
        id: 0,
        name: "Seleccione",
        parent_location_id: 0,
        original_location_id: 0,
      });
      return;
    }
    setStockLocation(selectedStock);
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
              </tr>
            </thead>
            <tbody ref={tableSectionRef}>
              {invoiceDetails.lines
                .filter((line) => line.qty_refund > 0)
                .map((line) => (
                  <tr
                    key={line.id}
                    onClick={() => handleEditRefund(line.id, true)}
                    className={`hover:bg-gray-200 hover:cursor-pointer`}
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
                          autoFocus={true}
                          className="border border-black w-[45px]"
                          type="number"
                        />
                      ) : (
                        getCurrencyFormat(line.price_subtotal_refund)
                      )}
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
                      (curr, line) => (curr += line.price_subtotal_refund),
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
        <div className="mt-3">
          <div className="inline-flex flex-col mr-1">
            <label htmlFor="cat_line" className="text-sm">
              Almacen destino
            </label>
            <Select
              id={stockLocation.id}
              handler={handleUpdateStockLocation}
              catalog={stockLocations}
              name={"cat_line"}
              autoFocus={false}
              className="w-[250px]"
            />
          </div>
        </div>
      </div>
      <Loader fetchStatus={refundStatus} portal={true} />
    </div>
  );
};
