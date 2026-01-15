import React from "react";
import { createPortal } from "react-dom";
import { formatCurrency, formatDateForPrint } from "../utils/formatters";
import type { Summary as SummaryType, Employee } from "../types";

interface SummaryPrintProps {
    summary: SummaryType;
    cashier: Employee | null;
    manager: Employee | null;
    posCash: number;
    posCard: number;
}

export const SummaryPrint: React.FC<SummaryPrintProps> = ({
    summary,
    cashier,
    manager,
    posCash,
    posCard,
}) => {
    const printElement = document.getElementById("print");

    if (!printElement) {
        return null;
    }

    return createPortal(
        <div className="relative inline-block overflow-hidden w-[296px] p-[15px]">
            <div className="text-center">
                <p className="font-bold uppercase">{summary.posName}</p>
                <p className="font-bold">{summary.sessionName}</p>
                <p className="font-bold mt-2">FECHA DE APERTURA</p>
                <p className="uppercase">{formatDateForPrint(summary.startAt)}</p>
                <p className="font-bold mt-2">FECHA DE CIERRE</p>
                <p className="uppercase">{formatDateForPrint(summary.stopAt)}</p>
                <p className="font-bold mt-2">CAJERO</p>
                <p>
                    {cashier ? `${cashier.first_name} ${cashier.last_name}` : "-"}
                </p>
                <p className="font-bold mt-2">CUADRADO POR</p>
                <p>
                    {manager ? `${manager.first_name} ${manager.last_name}` : "-"}
                </p>
                <p className="font-bold mt-2">VENTA EN TARJETA</p>
                <p>{formatCurrency(summary.odooCard)}</p>
                <p className="font-bold mt-2">VENTA EN EFECTIVO</p>
                <p>{formatCurrency(summary.odooCash)}</p>
                <p className="font-bold mt-2">TOTAL EFECTIVO CAJA</p>
                <p>{formatCurrency(posCash)}</p>
                <p className="font-bold mt-2">TOTAL TARJETA CAJA</p>
                <p>{formatCurrency(posCard)}</p>
                <p className="font-bold mt-2">NOTA DE CREDITO</p>
                <p>{formatCurrency(summary.odooCreditNote)}</p>
                <p className="h-6 border-b border-black mt-3"></p>
                <p className="font-bold">
                    {cashier ? `${cashier.first_name} ${cashier.last_name}` : "-"}
                </p>
                <p className="h-6 border-b border-black mt-3"></p>
                <p className="font-bold">
                    {manager ? `${manager.first_name} ${manager.last_name}` : "-"}
                </p>
            </div>
        </div>,
        printElement
    );
};
