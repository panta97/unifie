import React from "react";
import { formatDate } from "../utils/formatters";

interface HeaderProps {
  sessionId: string;
  sessionName: string;
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
  posName,
  startAt,
  stopAt,
  isSessionClosed,
  onSessionIdChange,
  onFetchSession,
}) => {
  return (
    <div className="col-span-2 row-start-1 grid grid-cols-[1fr_2fr_1fr] gap-4 py-3 px-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-md shadow-sm items-center">
      <div>
        <label htmlFor="sessionId" className="text-xs opacity-90 font-medium">
          Session ID:
        </label>
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
            Fetch
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="text-base font-semibold mb-0.5">
          Session: {sessionName || "Evening Shift - Main POS"}
        </div>
        <div className="text-xs opacity-85">
          POS: {posName || "MAIN-TERMINAL-A"}
        </div>
      </div>

      <div className="text-right text-xs opacity-90">
        <div>
          Start:{" "}
          {startAt
            ? formatDate(startAt).replace(/\//g, "-").slice(0, 16)
            : "08:00 AM"}
        </div>
        <div className="mt-0.5">
          Stop:{" "}
          {isSessionClosed ? (
            formatDate(stopAt).replace(/\//g, "-").slice(0, 16)
          ) : (
            <span className="text-red-300">04:00 PM</span>
          )}
        </div>
      </div>
    </div>
  );
};
