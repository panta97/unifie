import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X, Check, ArrowRight } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  invoiceNumber?: string;
  existingCount?: number;
  totalAmount?: number;
  currency?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Nota de Crédito Existente",
  message = "Esta factura ya tiene nota(s) de crédito registradas. ¿Está seguro que desea crear una nueva nota de crédito?",
  invoiceNumber,
  existingCount,
  totalAmount,
  currency = "S/",
  confirmText = "Sí, crear nota de crédito",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById("portal") || document.body;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onCancel}
      />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-scaleUp">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
                <AlertTriangle className="w-6 h-6 animate-bounce-short" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {title}
                </h3>
                {invoiceNumber && (
                  <span className="inline-block mt-0.5 text-xs font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    Factura: {invoiceNumber}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-sm text-gray-600 leading-relaxed mb-5">
            <p>{message}</p>
          
            {(existingCount !== undefined || totalAmount !== undefined) && (
              <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
                {existingCount !== undefined && (
                  <div>
                    <span className="text-gray-500 block">Emitidas previas:</span>
                    <span className="font-bold text-amber-800 text-sm">
                      {existingCount} {existingCount === 1 ? "nota" : "notas"}
                    </span>
                  </div>
                )}
                {totalAmount !== undefined && (
                  <div className="text-right">
                    <span className="text-gray-500 block">Nuevo monto a devolver:</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {currency} {totalAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 transition-all cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    modalRoot
  );
};
