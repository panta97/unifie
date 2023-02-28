import React from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "../../app/hooks";
import { selectManager } from "../../app/slice/pos/posSlice";
import { getCurrencyFormat, getTomorrowDate } from "../../utils";
import { PrintValidator } from "../PrintValidator";

export const BalanceStartPrint = () => {
  const manager = useAppSelector(selectManager);
  const bsnd = useAppSelector((root) => root.pos.summary.balanceStartNextDay);

  return createPortal(
    <div className="relative inline-block overflow-hidden w-[296px] p-[15px]">
      <PrintValidator>
        <div className="text-center">
          <p className="font-bold mt-2">INICIO DE CAJA DEL</p>
          <p>{getTomorrowDate()}</p>
          <p className="font-bold mt-2">DEJADO POR</p>
          <p>{manager.name}</p>
          <p className="font-bold mt-2">MONTO</p>
          <p>{getCurrencyFormat(bsnd)}</p>
          <p className="h-6 border-b border-black mt-3"></p>
          <p className="font-bold">{manager.name}</p>
        </div>
      </PrintValidator>
    </div>,
    document.getElementById("print")!
  );
};
