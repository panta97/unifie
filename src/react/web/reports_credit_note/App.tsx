import React, { useEffect, useState, useRef } from "react";
import './styles/App.css';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import SearchIcon from "@mui/icons-material/Search";
import ViewModeSwitcher from "./components/ViewModeSwitcher";
import CircularProgress from "@mui/material/CircularProgress";

interface OrderData {
  id: number;
  orden_pos: string;
  user_name?: string;
  config_name?: string;
  nota_credito_id: number;
  total: number;
  fecha: string;
  metodos_pago: string[];
}

const API_BASE_URL = 'https://octopus-app-ygvgz.ondigitalocean.app/api/pos-orders';
// const API_BASE_URL = 'http://127.0.0.1:8000/api/pos-orders';

const App: React.FC = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedPuntoVenta, setSelectedPuntoVenta] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDateRange, setShowDateRange] = useState(false);
  const dateRangeRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"list" | "module">("list");
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error('Error HTTP: ' + response.status);
        const data = await response.json();
        if (!data.orders || !Array.isArray(data.orders)) {
          throw new Error('Formato de datos inválido');
        }
        const transformed = data.orders.map((o: any, i: number) => ({
          id: o.id + i,
          orden_pos: o.orden_pos || 'N/A',
          user_name: o.user_name || 'Desconocido',
          config_name: o.config_name || 'Desconocido',
          nota_credito_id: o.nota_credito_id || 0,
          total: o.total || 0,
          fecha: o.fecha || new Date().toISOString(),
          metodos_pago: o.metodos_pago || []
        }));

        setOrders(transformed);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dateRangeRef.current &&
        !dateRangeRef.current.contains(event.target as Node)
      ) {
        setShowDateRange(false);
      }
    }
    if (showDateRange) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDateRange]);

  const uniqueUsers = [...new Set(orders.map(order => order.user_name))].filter(Boolean) as string[];
  const uniquePuntosVenta = [...new Set(orders.map(order => order.config_name))].filter(Boolean) as string[];

  const years = React.useMemo(() => {
    const set = new Set<string>();
    orders.forEach(order => {
      const year = new Date(order.fecha).getFullYear().toString();
      set.add(year);
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [orders]);

  useEffect(() => {
    if (years.length && !selectedYear) {
      setSelectedYear(years[0]);
    }
  }, [years]);

  if (error) return <div className="error">Error: {error}</div>;
  if (years.length && !selectedYear)
    return (
      <div className="loading" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 40 }}>
        <CircularProgress style={{ marginBottom: 16 }} />
        Cargando...
      </div>
    );

  const filteredOrders = orders.filter(order => {
    const orderYear = new Date(order.fecha).getFullYear().toString();
    const matchesYear = !selectedYear || orderYear === selectedYear;

    const matchesUser = !selectedUser || order.user_name === selectedUser;
    const matchesPuntoVenta = !selectedPuntoVenta || order.config_name === selectedPuntoVenta;

    const orderDate = new Date(order.fecha);
    const orderDatePeru = new Date(orderDate.toLocaleString('en-US', { timeZone: 'America/Lima' }));

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const startAdjusted = start
      ? new Date(Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate(),
          5, 0, 0, 0
        ))
      : null;

    const endAdjusted = end
      ? new Date(Date.UTC(
          end.getUTCFullYear(),
          end.getUTCMonth(),
          end.getUTCDate(),
          28, 59, 59, 999
        ))
      : null;

    const matchesStart = !startAdjusted || orderDatePeru >= startAdjusted;
    const matchesEnd = !endAdjusted || orderDatePeru <= endAdjusted;

    const term = searchTerm.toLowerCase();
    const termInOrder = order.orden_pos.toLowerCase().includes(term);
    const termInUser = order.user_name?.toLowerCase().includes(term);
    const termInPunto = order.config_name?.toLowerCase().includes(term);
    const termInTotal = order.total.toString().includes(term);
    const termInMetodo = order.metodos_pago.join(', ').toLowerCase().includes(term);
    const termInFecha = new Date(order.fecha).toLocaleString('es-PE').toLowerCase().includes(term);
    const matchesSearch = !term || termInOrder || termInUser || termInPunto || termInTotal || termInMetodo || termInFecha;

    return matchesYear && matchesUser && matchesPuntoVenta && matchesStart && matchesEnd && matchesSearch;
  });

  const lastIndex = currentPage * itemsPerPage;
  const firstIndex = lastIndex - itemsPerPage;
  const currentOrders = [...filteredOrders]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handlePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPaginationRange = () => {
    const totalNumbers = 5;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    let pages: (number | string)[] = [];

    pages.push(1);
    if (startPage > 2) pages.push("...");

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) pages.push("...");
    pages.push(totalPages);

    return pages;
  };

  const exportToExcel = () => {
    const sortedData = [...filteredOrders]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const worksheetData = sortedData.map(order => ({
      'Orden POS': order.orden_pos,
      'Usuario': order.user_name,
      'Punto de Venta': order.config_name,
      'Total': `S/ ${order.total.toFixed(2)}`,
      'Métodos de Pago': order.metodos_pago.join(', '),
      'Fecha': new Date(order.fecha).toLocaleString('es-PE')
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, `Notas de Crédito POS ${selectedYear || ""}`);

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(data, `credit_note_pos_${selectedYear || "all"}.xlsx`);
  };

  return (
    <div className="app-container">
      <div className="layout">
        <aside className="sidebar">
          <button className="back-button" onClick={() => window.history.back()}>
            <span className="arrow-rotate">➔</span> Regresar
          </button>
          <div className="year-selector" style={{ marginBottom: 16 }}>
            {years.map((year) => (
              <div
                key={year}
                onClick={() => { setSelectedYear(year); setCurrentPage(1); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: selectedYear === year ? 500 : 400,
                  color: selectedYear === year ? "#222" : "#888",
                  cursor: "pointer",
                  marginBottom: 8,
                  borderRadius: 6,
                  padding: "4px 8px"
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: selectedYear === year ? "#22c55e" : "#e5e7eb",
                    marginRight: 8,
                    border: selectedYear === year ? "2px solid #22c55e" : "2px solid #e5e7eb",
                    transition: "background 0.2s, border 0.2s"
                  }}
                />
                {`Año ${year}`}
              </div>
            ))}
          </div>
        </aside>

        <main className="main-content">
          <div className="header-top">
            <h1>Registro de Ventas Nota de Crédito en POS</h1>
            <button onClick={exportToExcel} className="export-button">
              Exportar a Excel
            </button>
          </div>

          <div className="search-filter-row">
            <div className="search-wrapper">
              <span className="search-icon"><SearchIcon /></span>
              <input
                type="text"
                placeholder="Buscar Ordenes, Usuarios, etc.."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="filter-user">Usuario:</label>
              <select
                id="filter-user"
                value={selectedUser}
                onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}>
                <option value="">Todos</option>
                {uniqueUsers.map((user) => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="filter-punto">Punto de Venta:</label>
              <select
                id="filter-punto"
                value={selectedPuntoVenta}
                onChange={(e) => { setSelectedPuntoVenta(e.target.value); setCurrentPage(1); }}>
                <option value="">Todos</option>
                {uniquePuntosVenta.map((pv) => (
                  <option key={pv} value={pv}>{pv}</option>
                ))}
              </select>
            </div>
            <ViewModeSwitcher
              viewMode={isMobile ? "module" : viewMode}
              onChange={setViewMode}
              showDateRange={showDateRange}
              setShowDateRange={setShowDateRange}
              dateRangeRef={dateRangeRef}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              setCurrentPage={setCurrentPage}
              hideListIcon={isMobile}
            />
          </div>

          {(isMobile || viewMode === "module") ? (
            <div className="table-wrapper" style={{ padding: isMobile ? 0 : 24 }}>
              {loading ? (
                <div className="loading" style={{ padding: 32, textAlign: "center" }}>Cargando...</div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: isMobile ? 10 : 18,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                >
                  {currentOrders.map(order => (
                    <div
                      key={`${order.id}-${order.fecha}`}
                      style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: isMobile ? "12px 10px 10px 10px" : "18px 18px 14px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                        fontSize: isMobile ? 13 : 15,
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box"
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#232324", fontSize: isMobile ? 15 : 16, marginBottom: 2 }}>
                        {order.orden_pos}
                      </div>
                      <div style={{ color: "#888", fontSize: isMobile ? 13 : 14, marginBottom: 2 }}>
                        Usuario: <span style={{ color: "#232324" }}>{order.user_name}</span>
                      </div>
                      <div style={{ color: "#888", fontSize: isMobile ? 13 : 14, marginBottom: 2 }}>
                        Punto de Venta: <span style={{ color: "#232324" }}>{order.config_name}</span>
                      </div>
                      <div style={{ color: "#232324", fontWeight: 500, fontSize: isMobile ? 14 : 15 }}>
                        Total: <span style={{ fontWeight: 600 }}>S/ {order.total.toFixed(2)}</span>
                      </div>
                      <div style={{ color: "#232324", fontSize: isMobile ? 13 : 14 }}>
                        Métodos de Pago:
                        <ul className="payment-list" style={{ marginTop: 2 }}>
                          {order.metodos_pago.map((m, i) => (
                            <li key={i}><span className="method">{m}</span></li>
                          ))}
                        </ul>
                      </div>
                      <div style={{ color: "#232324", fontSize: isMobile ? 13 : 14 }}>
                        Fecha: {new Date(order.fecha).toLocaleDateString('es-PE')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              {loading ? (
                <div className="loading" style={{ padding: 32, textAlign: "center" }}>Cargando...</div>
              ) : (
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th style={{ color: "gray" }}>Orden POS</th>
                      <th>Usuario</th>
                      <th>Punto de Venta</th>
                      <th>Venta Total</th>
                      <th>Método de Pago</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map(order => (
                      <tr key={`${order.id}-${order.fecha}`}>
                        <td style={{ color: "gray" }}>{order.orden_pos}</td>
                        <td>{order.user_name}</td>
                        <td>{order.config_name}</td>
                        <td className="amount">S/ {order.total.toFixed(2)}</td>
                        <td>
                          <ul className="payment-list">
                            {order.metodos_pago.map((m, i) => (
                              <li key={i}><span className="method">{m}</span></li>
                            ))}
                          </ul>
                        </td>
                        <td>{new Date(order.fecha).toLocaleDateString('es-PE')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => handlePage(currentPage - 1)} disabled={currentPage === 1}>
                &laquo; Anterior
              </button>
              {getPaginationRange().map((page, idx) =>
                typeof page === "string" ? (
                  <span key={`dots-${idx}`} className="dots">...</span>
                ) : (
                  <button
                    key={page}
                    className={page === currentPage ? 'active' : ''}
                    onClick={() => handlePage(page as number)}
                  >
                    {page}
                  </button>
                )
              )}
              <button onClick={() => handlePage(currentPage + 1)} disabled={currentPage === totalPages}>
                Siguiente &raquo;
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;