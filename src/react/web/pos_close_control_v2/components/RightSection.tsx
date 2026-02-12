import React, { useState } from "react";
import { formatCurrency } from "../utils/formatters";
import type { Employee } from "../types";

interface RightSectionProps {
  odooCash: number;
  odooCard: number;
  odooCreditNote: number;
  posCash: number;
  posCard: number;
  balanceStart: number;
  isSessionClosed: boolean;
  isExistingSession: boolean;
  managers: Employee[];
  selectedManager: Employee | null;
  onManagerChange: (managerId: number) => void;
  cashiers: Employee[];
  selectedCashier: Employee | null;
  onCashierChange: (cashierId: number) => void;
  observations: string;
  onObservationsChange: (note: string) => void;
  onSave: () => void;
  onPrint: () => void;
  disabled?: boolean;
}

export const RightSection: React.FC<RightSectionProps> = ({
  odooCash,
  odooCard,
  odooCreditNote,
  posCash,
  posCard,
  balanceStart,
  isSessionClosed,
  isExistingSession,
  managers,
  selectedManager,
  onManagerChange,
  cashiers,
  selectedCashier,
  onCashierChange,
  observations,
  onObservationsChange,
  onSave,
  onPrint,
  disabled = false,
}) => {
  // Modal state
  const [showModal, setShowModal] = useState(false);
  // Calculate totals
  const odooTotal = odooCash + odooCard;
  const cajaTotal = posCash + posCard;
  const difference = cajaTotal - odooTotal;

  // Determine status
  let status: "Faltante" | "Estable" | "Sobrante";
  let statusColorClasses: string;
  if (difference < 0) {
    status = "Faltante";
    statusColorClasses =
      "bg-gradient-to-br from-red-200 to-red-300 border-2 border-red-500";
  } else if (difference > 0) {
    status = "Sobrante";
    statusColorClasses =
      "bg-gradient-to-br from-orange-200 to-orange-300 border-2 border-orange-500";
  } else {
    status = "Estable";
    statusColorClasses =
      "bg-gradient-to-br from-green-200 to-green-300 border-2 border-green-600";
  }

  // Calculate bar widths (as percentages)
  const maxTotal = Math.max(odooTotal, cajaTotal);
  const odooWidth = maxTotal > 0 ? (odooTotal / maxTotal) * 100 : 0;
  const cajaWidth = maxTotal > 0 ? (cajaTotal / maxTotal) * 100 : 0;
  const diffWidth = maxTotal > 0 ? (Math.abs(difference) / maxTotal) * 100 : 0;

  // Estimate if difference bar is wide enough to show text (assuming ~400px container width for bars)
  const estimatedContainerWidth =
    typeof window !== "undefined" ? window.innerWidth * 0.35 : 400;
  const diffBarPixelWidth = (diffWidth / 100) * estimatedContainerWidth;
  const showDiffText = diffBarPixelWidth >= 65;

  // Calculate segment widths within each bar
  const odooEfectivoPercent = odooTotal > 0 ? (odooCash / odooTotal) * 100 : 0;
  const odooTarjetaPercent = odooTotal > 0 ? (odooCard / odooTotal) * 100 : 0;
  const cajaEfectivoPercent = cajaTotal > 0 ? (posCash / cajaTotal) * 100 : 0;
  const cajaTarjetaPercent = cajaTotal > 0 ? (posCard / cajaTotal) * 100 : 0;

  const textColor =
    status === "Faltante"
      ? "text-red-900"
      : status === "Sobrante"
      ? "text-amber-900"
      : "text-green-900";

  // Check if observations is required (when Faltante)
  const isObservationsRequired = difference < 0;
  const isObservationsEmpty = observations.trim() === "";
  const showObservationsError = isObservationsRequired && isObservationsEmpty;

  // Check if manager and cashier are selected (always required)
  const isManagerMissing = !selectedManager;
  const isCashierMissing = !selectedCashier;

  // Check if Guardar button should be disabled
  const isGuardarDisabled =
    !isSessionClosed ||
    (isObservationsRequired && isObservationsEmpty) ||
    isManagerMissing ||
    isCashierMissing;

  // Handle Guardar button click
  const handleGuardarClick = () => {
    if (isGuardarDisabled) {
      setShowModal(true);
    } else {
      onSave();
    }
  };

  // Get modal message based on which constraint is violated
  const getModalMessage = () => {
    const reasons: string[] = [];

    if (!isSessionClosed) {
      reasons.push("La sesión aún está abierta (Estado: Falso)");
    }
    if (isObservationsRequired && isObservationsEmpty) {
      reasons.push("Las observaciones son requeridas cuando hay un Faltante");
    }
    if (isManagerMissing) {
      reasons.push("Debe seleccionar un Gerente");
    }
    if (isCashierMissing) {
      reasons.push("Debe seleccionar un Cajero");
    }

    if (reasons.length === 1) {
      return `No se puede guardar porque ${reasons[0].toLowerCase()}`;
    } else if (reasons.length > 1) {
      return (
        "No se puede guardar por las siguientes razones:\n" +
        reasons.map((r, i) => `${i + 1}. ${r}`).join("\n")
      );
    }
    return "";
  };

  return (
    <div className="col-start-2 row-start-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto flex flex-col">
      <div className="font-semibold text-sm text-center py-2.5 px-4 bg-gradient-to-br from-slate-600 to-slate-700 text-white uppercase tracking-wide m-0 rounded-t-lg">
        RESUMEN
      </div>
      <div className="p-4">
        {/* Bar Comparator */}
        <div className="flex gap-3 items-stretch mt-3">
          <div className="flex-1 flex flex-col gap-2">
            {/* Odoo Bar */}
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-0.5">
              ODOO
            </div>
            <div className="flex gap-1 items-center min-h-[40px]">
              <div
                className="flex rounded-md overflow-hidden shadow-sm min-h-[40px] items-center transition-all duration-300"
                style={{ width: `${odooWidth}%` }}
              >
                {odooCash > 0 && (
                  <div
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white min-w-[80px] whitespace-nowrap transition-all duration-300 bg-gradient-to-br from-emerald-500 to-emerald-600"
                    style={{ width: `${odooEfectivoPercent}%` }}
                  >
                    <span className="text-base leading-none">💵</span>
                    <span className="font-mono text-[11px]">
                      {formatCurrency(odooCash)}
                    </span>
                  </div>
                )}
                {odooCard > 0 && (
                  <div
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white min-w-[80px] whitespace-nowrap transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600"
                    style={{ width: `${odooTarjetaPercent}%` }}
                  >
                    <span className="text-base leading-none">💳</span>
                    <span className="font-mono text-[11px]">
                      {formatCurrency(odooCard)}
                    </span>
                  </div>
                )}
              </div>
              {/* Sobrante bar (shown next to Odoo if Caja > Odoo) */}
              {difference > 0 && (
                <div
                  className="flex items-center justify-center h-[32px] px-2.5 py-2 rounded-md text-[11px] font-semibold font-mono text-white min-w-[1px] shadow-sm transition-all duration-300 bg-gradient-to-br from-amber-500 to-amber-600"
                  style={{ width: `${diffWidth}%` }}
                >
                  {showDiffText && formatCurrency(Math.abs(difference))}
                </div>
              )}
            </div>

            {/* Caja Bar */}
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-0.5 mt-2">
              CAJA
            </div>
            <div className="flex gap-1 items-center min-h-[40px]">
              <div
                className="flex rounded-md overflow-hidden shadow-sm min-h-[40px] items-center transition-all duration-300"
                style={{ width: `${cajaWidth}%` }}
              >
                {posCash > 0 && (
                  <div
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white min-w-[80px] whitespace-nowrap transition-all duration-300 bg-gradient-to-br from-emerald-500 to-emerald-600"
                    style={{ width: `${cajaEfectivoPercent}%` }}
                  >
                    <span className="text-base leading-none">💵</span>
                    <span className="font-mono text-[11px]">
                      {formatCurrency(posCash)}
                    </span>
                  </div>
                )}
                {posCard > 0 && (
                  <div
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white min-w-[80px] whitespace-nowrap transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600"
                    style={{ width: `${cajaTarjetaPercent}%` }}
                  >
                    <span className="text-base leading-none">💳</span>
                    <span className="font-mono text-[11px]">
                      {formatCurrency(posCard)}
                    </span>
                  </div>
                )}
              </div>
              {/* Faltante bar (shown next to Caja if Odoo > Caja) */}
              {difference < 0 && (
                <div
                  className="flex items-center justify-center h-[32px] px-2.5 py-2 rounded-md text-[11px] font-semibold font-mono text-white min-w-[1px] shadow-sm transition-all duration-300 bg-gradient-to-br from-red-500 to-red-600"
                  style={{ width: `${diffWidth}%` }}
                >
                  {showDiffText && formatCurrency(Math.abs(difference))}
                </div>
              )}
            </div>
          </div>

          {/* Status Box */}
          <div
            className={`flex flex-col items-center justify-center px-5 py-4 rounded-lg shadow-md min-w-[140px] gap-2 transition-all duration-300 ${statusColorClasses}`}
          >
            <div
              className={`text-base font-bold uppercase tracking-wide ${textColor}`}
            >
              {status}
            </div>
            <div className={`text-lg font-bold font-mono ${textColor}`}>
              {formatCurrency(Math.abs(difference))}
            </div>
          </div>
        </div>

        {/* Info Table */}
        <div className="mt-5">
          <table className="w-full text-sm">
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="w-1/2 px-2.5 py-2 border-b border-gray-100 font-medium text-slate-700">
                  Total Odoo:
                </td>
                <td className="text-right font-mono text-sm px-2.5 py-2 border-b border-gray-100">
                  {formatCurrency(odooTotal)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="w-1/2 px-2.5 py-2 border-b border-gray-100 font-medium text-slate-700">
                  Total Caja:
                </td>
                <td className="text-right font-mono text-sm px-2.5 py-2 border-b border-gray-100">
                  {formatCurrency(cajaTotal)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="w-1/2 px-2.5 py-2 border-b border-gray-100 font-medium text-slate-700">
                  Nota de Crédito:
                </td>
                <td className="text-right font-mono text-sm px-2.5 py-2 border-b border-gray-100">
                  {formatCurrency(odooCreditNote)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="w-1/2 px-2.5 py-2 border-b border-gray-100 font-medium text-slate-700">
                  Inicio:
                </td>
                <td className="text-right font-mono text-sm px-2.5 py-2 border-b border-gray-100">
                  {formatCurrency(balanceStart)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Manager Dropdown */}
        <div className="mt-4">
          <label className="block mb-1.5 font-medium text-sm text-slate-600">
            Gerente:<span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={selectedManager?.id || ""}
            onChange={(e) => onManagerChange(Number(e.target.value))}
            className={`w-full text-sm px-2.5 py-1.5 border rounded transition-all duration-200 cursor-pointer bg-white focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 ${
              isManagerMissing
                ? "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200"
                : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }`}
            disabled={disabled}
          >
            <option value="">Seleccionar Gerente</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.first_name} {manager.last_name.charAt(0)}.
              </option>
            ))}
          </select>
        </div>

        {/* Cajero Dropdown */}
        <div className="mt-4">
          <label className="block mb-1.5 font-medium text-sm text-slate-600">
            Cajero:<span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={selectedCashier?.id || ""}
            onChange={(e) => onCashierChange(Number(e.target.value))}
            className={`w-full text-sm px-2.5 py-1.5 border rounded transition-all duration-200 cursor-pointer bg-white focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 ${
              isCashierMissing
                ? "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200"
                : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }`}
            disabled={disabled}
          >
            <option value="">Seleccionar Cajero</option>
            {cashiers.map((cashier) => (
              <option key={cashier.id} value={cashier.id}>
                {cashier.first_name} {cashier.last_name.charAt(0)}.
              </option>
            ))}
          </select>
        </div>

        {/* Observations */}
        <div className="mt-4">
          <label className="block mb-1.5 font-medium text-sm text-slate-600">
            Observaciones:
            {isObservationsRequired && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          <textarea
            value={observations}
            onChange={(e) => onObservationsChange(e.target.value)}
            placeholder={
              isObservationsRequired
                ? "Requerido: Explica el faltante..."
                : "Escribe observaciones aquí..."
            }
            rows={3}
            className={`w-full text-sm px-2.5 py-2 border rounded transition-all duration-200 resize-y min-h-[60px] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 ${
              showObservationsError
                ? "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200"
                : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }`}
            disabled={disabled}
          />
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-2">
          {/* Save Button */}
          <button
            onClick={handleGuardarClick}
            className={`w-full mt-4 py-3 border-none rounded-md text-sm font-semibold uppercase tracking-wide transition-all duration-200 shadow-md ${
              isGuardarDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            }`}
          >
            {isExistingSession ? "ACTUALIZAR" : "GUARDAR"}
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No se puede guardar
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {getModalMessage()}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-md text-sm font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
