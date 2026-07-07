import React, { useState, useRef, useEffect } from "react";
import {
  formatDate,
  formatCurrency,
  getDifferenceLabel,
  parseBackendDate,
} from "../utils/formatters";
import type { Snapshot } from "../types";

// Map a stored end_state code (EX/ST/MS or full word) to a Spanish label + color.
const getEndStateBadge = (
  endState: string,
): { label: string; className: string } => {
  const s = (endState || "").toUpperCase();
  if (s === "MS" || s === "MISSING") {
    return { label: "Faltante", className: "bg-red-100 text-red-700" };
  }
  if (s === "EX" || s === "EXTRA") {
    return { label: "Extra", className: "bg-orange-100 text-orange-700" };
  }
  return { label: "Estable", className: "bg-green-100 text-green-700" };
};

// A single row in the "Historial de Versiones" dropdown. `isCurrent` renders
// the live (not-yet-snapshotted) session state at the top, marked "Actual".
const SnapshotRow: React.FC<{ snapshot: Snapshot; isCurrent?: boolean }> = ({
  snapshot,
  isCurrent = false,
}) => {
  // Caja vs Odoo delta — includes the next-day starting float,
  // matching the app's closing difference calc.
  const delta =
    snapshot.pos_cash +
    snapshot.balance_start_next_day +
    snapshot.pos_card -
    snapshot.odoo_cash -
    snapshot.odoo_card;
  // Color the Caja vs Odoo delta by sign (green/orange/red).
  const deltaClass =
    delta === 0
      ? "bg-green-100 text-green-700"
      : delta > 0
        ? "bg-orange-100 text-orange-700"
        : "bg-red-100 text-red-700";
  // Recorded closing result — only meaningful once CLOSED
  const diff =
    snapshot.status === "CLOSED" ? getEndStateBadge(snapshot.end_state) : null;

  return (
    <div
      className={`p-2 rounded text-xs border-b border-gray-100 last:border-b-0 ${
        isCurrent ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="font-semibold text-blue-600 flex items-center gap-1">
          {!isCurrent && `Versión ${snapshot.version}`}
          {isCurrent && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
              Actual
            </span>
          )}
        </span>
        <span className="text-gray-500">
          {isCurrent
            ? "En vivo"
            : parseBackendDate(snapshot.snapshot_created_at).toLocaleString(
                "es-PE",
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                },
              )}
        </span>
      </div>

      {/* Recorded closing result (Cerrado only) */}
      {/* {diff && (
        <div className="mt-1">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${diff.className}`}
          >
            {diff.label}: {formatCurrency(snapshot.end_state_amount)}
          </span>
        </div>
      )} */}

      <div className="mt-1 text-gray-600 space-y-0.5">
        <div>Cajero: {snapshot.cashier || "N/A"}</div>
        <div>Supervisor: {snapshot.manager || "N/A"}</div>
        <div className="text-gray-500">
          Caja: Efvo {formatCurrency(snapshot.pos_cash)} · Tarj{" "}
          {formatCurrency(snapshot.pos_card)}
        </div>
        <div className="text-gray-500">
          Odoo: Efvo {formatCurrency(snapshot.odoo_cash)} · Tarj{" "}
          {formatCurrency(snapshot.odoo_card)}
        </div>
        <div className="mt-0.5">
          Caja vs Odoo:{" "}
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${deltaClass}`}
          >
            {getDifferenceLabel(delta)} {formatCurrency(Math.abs(delta))}
          </span>
        </div>
        <div className="mt-0.5">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
              snapshot.status === "CLOSED"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {snapshot.status === "CLOSED" ? "Cerrado" : "Borrador"}
          </span>
        </div>
      </div>
    </div>
  );
};

interface HeaderProps {
  sessionId: string;
  sessionName: string;
  configDisplayName: string;
  posName: string;
  startAt: string;
  stopAt: string;
  isSessionClosed: boolean;
  loading?: boolean;
  autosaveStatus?: "idle" | "saving" | "saved" | "error";
  snapshotCount: number;
  snapshots: Snapshot[];
  currentVersion?: Snapshot | null;
  onSessionIdChange: (id: string) => void;
  onFetchSession: () => void;
  onLock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sessionId,
  sessionName,
  configDisplayName,
  posName,
  startAt,
  stopAt,
  isSessionClosed,
  loading = false,
  autosaveStatus = "idle",
  snapshotCount,
  snapshots,
  currentVersion = null,
  onSessionIdChange,
  onFetchSession,
  onLock,
}) => {
  const [showSnapshots, setShowSnapshots] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click-outside detection to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSnapshots(false);
      }
    };

    if (showSnapshots) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSnapshots]);

  return (
    <div className="col-span-2 row-start-1 grid grid-cols-[1fr_2fr_1fr] gap-4 py-3 px-4 bg-white border border-gray-200 rounded-lg shadow-sm items-center">
      <div>
        <div className="flex gap-1.5 mt-1 items-center">
          <input
            id="sessionId"
            type="text"
            value={sessionId}
            onChange={(e) => onSessionIdChange(e.target.value)}
            placeholder="Enter ID"
            className="text-sm px-2 py-1 rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full"
            disabled={loading}
          />
          <button
            className="px-4 py-1 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded cursor-pointer text-xs font-semibold uppercase tracking-wide transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onFetchSession}
            disabled={loading}
          >
            Buscar
          </button>
          {loading && (
            <div className="ml-1">
              <svg
                className="animate-spin h-4 w-4 text-emerald-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-base font-semibold mb-0.5">
          Sesión: {sessionName || "-"}
        </div>
        <div className="text-xs text-slate-500">{configDisplayName || "-"}</div>
        {/* Autosave status indicator */}
        {/* {autosaveStatus !== "idle" && (
          <div
            className={`mt-1 text-xs flex items-center gap-1 ${
              autosaveStatus === "error" ? "text-red-600" : "text-slate-500"
            }`}
          >
            {autosaveStatus === "saving" && (
              <>
                <svg
                  className="w-3 h-3 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Guardando…</span>
              </>
            )}
            {autosaveStatus === "saved" && <span>✓ Guardado</span>}
            {autosaveStatus === "error" && <span>Error al guardar</span>}
          </div>
        )} */}
        {/* Version History Display */}
        {snapshotCount > 0 && (
          <div className="mt-2 relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSnapshots(!showSnapshots)}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1 ml-auto"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {snapshotCount} versi{snapshotCount !== 1 ? "o" : "ó"}n{snapshotCount !== 1 ? "es" : ""}
              </span>
            </button>

            {/* Dropdown */}
            {showSnapshots && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-2 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-xs font-semibold text-gray-700">
                    Historial de Versiones
                  </h4>
                </div>
                <div className="p-1">
                  {currentVersion && (
                    <SnapshotRow snapshot={currentVersion} isCurrent />
                  )}
                  {snapshots.map((snapshot) => (
                    <SnapshotRow key={snapshot.id} snapshot={snapshot} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-right text-sm flex flex-col items-end gap-2">
        <div>
          <div>
            Apertura:{" "}
            <span>
              {startAt
                ? formatDate(startAt).replace(/\//g, "-").slice(0, 16)
                : "08:00 AM"}
            </span>
          </div>
          <div className="mt-0.5">
            Cierre:{" "}
            {isSessionClosed ? (
              <span>{formatDate(stopAt).replace(/\//g, "-").slice(0, 16)}</span>
            ) : (
              <span className="text-red-600 font-semibold">Pendiente</span>
            )}
          </div>
        </div>
        <button
          onClick={onLock}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-300 rounded hover:bg-slate-200 transition-colors"
          title="Bloquear pantalla"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Bloquear
        </button>
      </div>
    </div>
  );
};
