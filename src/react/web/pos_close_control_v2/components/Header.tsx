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
  onSessionIdChange,
  onFetchSession,
}) => {
  return (
    <div className="col-span-2 row-start-1 grid grid-cols-[1fr_2fr_1fr] gap-4 py-3 px-4 rounded-md shadow-sm items-center">
      <div>
        <div className="flex gap-1.5 mt-1">
          <input
            id="sessionId"
            type="text"
            value={sessionId}
            onChange={(e) => onSessionIdChange(e.target.value)}
            placeholder="Enter ID"
            className="text-sm px-2 py-1 rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full"
          />
          <button
            className="px-4 py-1 bg-gradient-to-br from-emerald-500 to-emerald-600 border-none rounded cursor-pointer text-xs font-semibold uppercase tracking-wide transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
            onClick={onFetchSession}
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="text-base font-semibold mb-0.5">
          Sesión: {sessionName || "-"}
        </div>
        <div className="text-xs opacity-85">
          POS: {configDisplayName || "-"}
        </div>
      </div>

      <div className="text-right text-sm opacity-90">
        <div>
          Apertura:{" "}
          <span className="font-semibold">
            {startAt
              ? formatDate(startAt).replace(/\//g, "-").slice(0, 16)
              : "08:00 AM"}
          </span>
        </div>
        <div className="mt-0.5">
          Cierre:{" "}
          {isSessionClosed ? (
            <span className="font-semibold">
              {formatDate(stopAt).replace(/\//g, "-").slice(0, 16)}
            </span>
          ) : (
            <span className="text-red-600 font-semibold">Pendiente</span>
          )}
        </div>
      </div>
    </div>
  );
};
