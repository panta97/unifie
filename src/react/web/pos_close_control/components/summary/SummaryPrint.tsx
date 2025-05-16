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

interface SummaryPrintProps {
  includeBalanceStart: boolean;
}

export const SummaryPrint: React.FC<SummaryPrintProps> = ({ includeBalanceStart }) => {
  const summary = useAppSelector(selectSummary);
  const posName = useAppSelector(selectPosName);
  const cashier = useAppSelector(selectCashier);
  const manager = useAppSelector(selectManager);
  const { mainSession, extraSessions } = useAppSelector((state: any) => state.pos);

  const sessions = [
    ...(mainSession ? [mainSession] : []),
    ...(Array.isArray(extraSessions) ? extraSessions : []),
  ];

  const posNames = sessions.map((s) => s.posName || "").filter(Boolean).join(" - ") || posName;
  const sessionNames = sessions
    .map((s) => s.sessionName ? `POS/${s.sessionName}` : "")
    .filter(Boolean)
    .join(" - ");

  const totalOdooCard = sessions.reduce((acc: number, s: any) => acc + (s.odooCard || 0), 0);
  const totalOdooCreditNote = sessions.reduce((acc: number, s: any) => acc + (s.odooCreditNote || 0), 0);

  const totalOdooCash = sessions.reduce((acc: number, s: any) => {
    const cash = s.odooCash || 0;
    const balance = s.balanceStart || 0;
    return acc + (includeBalanceStart ? cash : cash - balance);
  }, 0);

  return createPortal(
    <div className="relative inline-block overflow-hidden w-[296px] p-[15px]">
      <PrintValidator>
        <div className="text-center">
          <p className="font-bold uppercase">{posNames}</p>
          <p className="font-bold">{sessionNames}</p>
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
            {manager.first_name} {manager.last_name}
          </p>
          <p className="font-bold mt-2">VENTA EN TARJETA</p>
          <p>{getCurrencyFormat(totalOdooCard)}</p>
          <p className="font-bold mt-2">VENTA EN EFECTIVO</p>
          <p>{getCurrencyFormat(totalOdooCash)}</p>
          <p className="font-bold mt-2">NOTA DE CREDITO</p>
          <p>{getCurrencyFormat(totalOdooCreditNote)}</p>
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
