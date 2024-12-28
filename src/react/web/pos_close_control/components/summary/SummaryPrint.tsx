import React from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "../../app/hooks";
import {
  selectCashDenominations,
  selectCashier,
  selectManager,
  selectPosName,
  selectSummary,
} from "../../app/slice/pos/posSlice";
import { getDateFormat } from "../../shared";
import { getCurrencyFormat } from "../../utils";
import { PrintValidator } from "../PrintValidator";

export const SummaryPrint = () => {
  const summary = useAppSelector(selectSummary);
  const posName = useAppSelector(selectPosName);
  const cashier = useAppSelector(selectCashier);
  const manager = useAppSelector(selectManager);

  return createPortal(
    <div className="relative inline-block overflow-hidden w-[296px] p-[15px]">
      <PrintValidator>
        <div className="text-center">
          <p className="font-bold uppercase">{posName}</p>
          <p className="font-bold">{summary.sessionName}</p>
          <p className="font-bold mt-2">FECHA DE APERTURA</p>
          <p className="uppercase">{getDateFormat(summary.startAt)}</p>
          <p className="font-bold mt-2">FECHA DE CIERRE</p>
          <p className="uppercase">{getDateFormat(summary.stopAt)}</p>
          <p className="font-bold mt-2">CAJERO</p>
          <p>
            {cashier.first_name} {cashier.last_name}
          </p>
          <p className="font-bold mt-2">CUADRADO POR</p>
          <p>
            {manager.first_name} {manager.first_name}
          </p>
          <p className="font-bold mt-2">VENTA EN TARJETA</p>
          <p>{getCurrencyFormat(summary.odooCard)}</p>
          <p className="font-bold mt-2">VENTA EN EFECTIVO</p>
          <p>{getCurrencyFormat(summary.profitTotal)}</p>
          <p className="font-bold mt-2">NOTA DE CREDITO</p>
          <p>{getCurrencyFormat(summary.odooCreditNote)}</p>
          <p className="h-6 border-b border-black mt-3"></p>
          <p className="font-bold">
            {cashier.first_name} {cashier.last_name}
          </p>
          <p className="h-6 border-b border-black mt-3"></p>
          <p className="font-bold">
            {manager.first_name} {manager.last_name}
          </p>
        </div>
      </PrintValidator>
    </div>,
    document.getElementById("print")!
  );
};
