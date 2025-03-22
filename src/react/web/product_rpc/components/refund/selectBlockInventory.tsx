import React from "react";
import { useAppSelector } from "../../app/hooks";
import { selectInvoiceItem } from "../../app/slice/refund/invoiceSlice";

const getStockLocationName = (invoiceNumber: string) => {
  const num = invoiceNumber.toUpperCase();
  
  if (/^(B00[1-9]|F00[1-9])/.test(num)) {
    return "ABTAO-KDO1/TIENDA";
  }
  if (/^(B010|F010)/.test(num)) {
    return "SAN MARTIN-KDO2/TIENDA";
  }
  if (/^(B01[1-3]|F01[1-3])/.test(num)) {
    return "TINGO MARIA-KDO3/TIENDA";
  }
  return "Almacén no definido";
};

export const BlockInventory = () => {
  const invoiceDetails = useAppSelector(selectInvoiceItem);

  const stockLocationName =
    invoiceDetails.number && getStockLocationName(invoiceDetails.number);

  return (
    <div className="p-4 font-invoice text-[13px] text-black border border-gray-300 rounded-md">
      <h3 className="font-bold text-lg">Almacén Destino</h3>
      {stockLocationName ? (
        <p className="text-sm">{stockLocationName}</p>
      ) : (
        <p className="text-sm text-red-600">Aún no se definió un almacén.</p>
      )}
    </div>
  );
};

export default BlockInventory;
