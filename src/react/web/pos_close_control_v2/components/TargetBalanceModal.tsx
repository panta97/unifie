import React, { useEffect, useState } from "react";
import type { CashDenominations } from "../types";
import type {
  DenominationInput,
  BalanceCandidate,
  WorkerRequest,
  WorkerResponse,
} from "../workers/balanceCalculator.types";

const DENOM_MAP: { key: keyof CashDenominations; denom: number }[] = [
  { key: "d0_10", denom: 0.1 },
  { key: "d0_20", denom: 0.2 },
  { key: "d0_50", denom: 0.5 },
  { key: "d1_00", denom: 1 },
  { key: "d2_00", denom: 2 },
  { key: "d5_00", denom: 5 },
  { key: "d10_00", denom: 10 },
  { key: "d20_00", denom: 20 },
  { key: "d50_00", denom: 50 },
  { key: "d100_00", denom: 100 },
  { key: "d200_00", denom: 200 },
];

const MAX_DISPLAY = 20;

interface TargetBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashDenominations: CashDenominations;
  balanceStart: number; // in cents
}

export const TargetBalanceModal: React.FC<TargetBalanceModalProps> = ({
  isOpen,
  onClose,
  cashDenominations,
  balanceStart,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<BalanceCandidate[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [computeTimeMs, setComputeTimeMs] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setCandidates([]);
    setTotalFound(0);
    setComputeTimeMs(0);
    setError(null);
    setExpandedIndex(null);
    setLoading(true);

    const worker = new Worker(
      new URL("../workers/balanceCalculator.worker.ts", import.meta.url),
      { type: "module" },
    );

    const denominations: DenominationInput[] = DENOM_MAP.map(
      ({ key, denom }) => ({
        denom,
        qty: cashDenominations[key],
      }),
    );

    const targetAmount = balanceStart / 100;

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      setCandidates(e.data.candidates.slice(0, MAX_DISPLAY));
      setTotalFound(e.data.totalFound);
      setComputeTimeMs(e.data.computeTimeMs);
      setExpandedIndex(e.data.candidates.length > 0 ? 0 : null);
      setLoading(false);
    };

    worker.onerror = (err) => {
      setError(err.message || "Error al calcular combinaciones");
      setLoading(false);
    };

    const request: WorkerRequest = { denominations, targetAmount };
    worker.postMessage(request);

    return () => {
      worker.terminate();
    };
  }, [isOpen, cashDenominations, balanceStart]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Inicio: S/. {(balanceStart / 100).toFixed(2)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">
                Calculando combinaciones...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && candidates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-sm text-gray-500">
                No se encontraron combinaciones que sumen el monto objetivo con
                las cantidades ingresadas.
              </p>
            </div>
          )}

          {!loading && !error && candidates.length > 0 && (
            <>
              <p className="text-xs text-gray-500 mb-3">
                {totalFound} combinacion{totalFound !== 1 ? "es" : ""}{" "}
                encontrada{totalFound !== 1 ? "s" : ""} en{" "}
                {computeTimeMs.toFixed(0)}ms
                {totalFound > MAX_DISPLAY &&
                  ` (mostrando las ${MAX_DISPLAY} mejores)`}
              </p>

              <div className="space-y-1">
                {candidates.map((candidate, idx) => {
                  const isExpanded = expandedIndex === idx;
                  const nonZeroAmounts = candidate.amounts.filter(
                    (a) => a.qty > 0,
                  );

                  return (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedIndex(isExpanded ? null : idx)
                        }
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          #{idx + 1}
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            {(() => {
                              const coinCount = nonZeroAmounts
                                .filter((a) => a.denom <= 5)
                                .reduce((sum, a) => sum + a.qty, 0);
                              const billCount = nonZeroAmounts
                                .filter((a) => a.denom >= 10)
                                .reduce((sum, a) => sum + a.qty, 0);
                              const parts: string[] = [];
                              if (coinCount > 0) parts.push(`Monedas: ${coinCount} pzs`);
                              if (billCount > 0) parts.push(`Billetes: ${billCount} pzs`);
                              return parts.join(" · ");
                            })()}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-3 py-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-500">
                                <th className="text-left py-1">
                                  Denominaci&oacute;n
                                </th>
                                <th className="text-center py-1">Cantidad</th>
                                <th className="text-right py-1">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {nonZeroAmounts.map((a, i) => (
                                <tr
                                  key={i}
                                  className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                                >
                                  <td className="py-1 font-mono">
                                    S/.{" "}
                                    {a.denom % 1 === 0
                                      ? a.denom.toFixed(2)
                                      : a.denom.toFixed(2)}
                                  </td>
                                  <td className="text-center py-1 font-mono">
                                    {a.qty}
                                  </td>
                                  <td className="text-right py-1 font-mono">
                                    S/. {(a.denom * a.qty).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t-2 border-gray-300 font-semibold">
                                <td
                                  colSpan={2}
                                  className="py-1 text-right pr-2"
                                >
                                  Total:
                                </td>
                                <td className="text-right py-1 font-mono">
                                  S/. {candidate.accumulatedAmount.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="mt-1 text-[10px] text-gray-400">
                            Puntaje: {candidate.score}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-md text-sm font-semibold hover:shadow-lg transition-all duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
