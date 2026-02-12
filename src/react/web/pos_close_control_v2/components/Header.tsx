import React, { useState, useRef, useEffect } from "react";
import { formatDate } from "../utils/formatters";
import type { Snapshot } from "../types";

interface HeaderProps {
  sessionId: string;
  sessionName: string;
  configDisplayName: string;
  posName: string;
  startAt: string;
  stopAt: string;
  isSessionClosed: boolean;
  loading?: boolean;
  snapshotCount: number;
  snapshots: Snapshot[];
  onSessionIdChange: (id: string) => void;
  onFetchSession: () => void;
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
  snapshotCount,
  snapshots,
  onSessionIdChange,
  onFetchSession,
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
    <div className="col-span-2 row-start-1 grid grid-cols-[1fr_2fr_1fr] gap-4 py-3 px-4 rounded-md shadow-sm items-center">
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
            className="px-4 py-1 bg-gradient-to-br from-emerald-500 to-emerald-600 border-none rounded cursor-pointer text-xs font-semibold uppercase tracking-wide transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="text-xs opacity-85">{configDisplayName || "-"}</div>
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
                {snapshotCount} snapshot{snapshotCount !== 1 ? "s" : ""}
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
                  {snapshots.map((snapshot) => (
                    <div
                      key={snapshot.id}
                      className="p-2 hover:bg-gray-50 rounded text-xs border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-blue-600">
                          Versión {snapshot.version}
                        </span>
                        <span className="text-gray-500">
                          {new Date(
                            snapshot.snapshot_created_at
                          ).toLocaleDateString("es-PE", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-600">
                        <div>Cajero: {snapshot.cashier || "N/A"}</div>
                        <div>Gerente: {snapshot.manager || "N/A"}</div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                              snapshot.status === "CLOSED"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {snapshot.status === "CLOSED"
                              ? "Cerrado"
                              : "Borrador"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-right text-sm">
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
    </div>
  );
};
