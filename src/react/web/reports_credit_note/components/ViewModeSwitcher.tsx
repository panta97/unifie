import React from "react";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

interface Props {
    viewMode: "list" | "module";
    onChange: (mode: "list" | "module") => void;
    showDateRange: boolean;
    setShowDateRange: (v: boolean) => void;
    dateRangeRef: React.RefObject<HTMLDivElement>;
    startDate: string;
    endDate: string;
    setStartDate: (v: string) => void;
    setEndDate: (v: string) => void;
    setCurrentPage: (v: number) => void;
    hideListIcon?: boolean;
}

const ViewModeSwitcher: React.FC<Props> = ({
    viewMode,
    onChange,
    showDateRange,
    setShowDateRange,
    dateRangeRef,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    setCurrentPage,
    hideListIcon,
}) => (
    <div className="view-icons view-icons-bg" style={{ height: "35px", padding: "0 8px", minHeight: "35px", position: "relative" }}>
        {!hideListIcon && (
            <button
                title="Vista lista"
                className="view-icon-btn"
                style={{
                    width: 28, height: 28, minWidth: 28, minHeight: 28,
                    background: viewMode === "list" ? "#111" : "#fff",
                    border: viewMode === "list" ? "1.5px solid #111" : "none",
                    transition: "all 0.15s"
                }}
                onClick={() => onChange("list")}
                type="button"
            >
                <ViewListIcon
                    className="view-icon-svg"
                    style={{
                        fontSize: 18,
                        color: viewMode === "list" ? "#fff" : "gray",
                        transition: "color 0.15s"
                    }}
                />
            </button>
        )}
        <button
            title="Vista módulos"
            className="view-icon-btn"
            style={{
                width: 28, height: 28, minWidth: 28, minHeight: 28,
                background: viewMode === "module" ? "#111" : "#fff",
                border: viewMode === "module" ? "1.5px solid #111" : "none",
                transition: "all 0.15s"
            }}
            onClick={() => onChange("module")}
            type="button"
        >
            <ViewModuleIcon
                className="view-icon-svg"
                style={{
                    fontSize: 18,
                    color: viewMode === "module" ? "#fff" : "gray",
                    transition: "color 0.15s"
                }}
            />
        </button>
        <button
            title="Filtrar por rango de fechas"
            className="view-icon-btn"
            style={{
                width: 28, height: 28, minWidth: 28, minHeight: 28,
                background: showDateRange ? "#111" : "#fff",
                border: showDateRange ? "1.5px solid #111" : "none",
                transition: "all 0.15s"
            }}
            onClick={() => setShowDateRange(!showDateRange)}
            type="button"
        >
            <CalendarTodayIcon
                className="view-icon-svg"
                style={{
                    fontSize: 18,
                    color: showDateRange ? "#fff" : "gray",
                    transition: "color 0.15s"
                }}
            />
        </button>
        {showDateRange && (
            <div
                ref={dateRangeRef}
                className="date-range-popover"
                style={{
                    position: "absolute",
                    top: 40,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    padding: "18px 22px 14px 22px",
                    zIndex: 100,
                    minWidth: 230,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label htmlFor="start-date" style={{ fontSize: 13, color: "#555" }}>Desde:</label>
                        <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                            style={{
                                padding: "6px 10px",
                                borderRadius: 5,
                                border: "1px solid #ddd",
                                fontSize: 14,
                                background: "#f9fafb"
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label htmlFor="end-date" style={{ fontSize: 13, color: "#555" }}>Hasta:</label>
                        <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                            style={{
                                padding: "6px 10px",
                                borderRadius: 5,
                                border: "1px solid #ddd",
                                fontSize: 14,
                                background: "#f9fafb"
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                        <button
                            type="button"
                            style={{
                                background: "#f3f4f6",
                                border: "none",
                                borderRadius: 5,
                                padding: "6px 14px",
                                fontSize: 14,
                                color: "#232324",
                                cursor: "pointer"
                            }}
                            onClick={() => {
                                setStartDate("");
                                setEndDate("");
                                setShowDateRange(false);
                                setCurrentPage(1);
                            }}
                        >
                            Limpiar
                        </button>
                        <button
                            type="button"
                            style={{
                                background: "#111",
                                color: "#fff",
                                border: "none",
                                borderRadius: 5,
                                padding: "6px 14px",
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: "pointer"
                            }}
                            onClick={() => setShowDateRange(false)}
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
);

export default ViewModeSwitcher;
