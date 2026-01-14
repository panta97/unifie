import React from "react";
import { formatDate } from "../utils/formatters";

interface HeaderProps {
  sessionId: string;
  sessionName: string;
  configDisplayName: string;
  posName: string;
  startAt: string;
  stopAt: string;
  isSessionClosed: boolean;
  loading?: boolean;
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
  onSessionIdChange,
  onFetchSession,
}) => {
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

      <div className="text-center">
        <div className="text-base font-semibold mb-0.5">
          Sesión: {sessionName || "-"}
        </div>
        <div className="text-xs opacity-85">{configDisplayName || "-"}</div>
      </div>

      <div className="text-right text-sm opacity-90">
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
