import React, { useEffect, useState } from "react";
import './styles/App.css';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

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
  const [searchTerm, setSearchTerm] = useState<string>("");

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

        // const multiplied = Array(200).fill(null).flatMap((_, i) =>
        //   transformed.map((o, index) => ({
        //     ...o,
        //     id: o.id + index + i * transformed.length,
        //     orden_pos: `${o.orden_pos}-${i + 1}`,
        //     fecha: new Date(Date.now() + i * 6000000).toISOString()
        //   }))
        // );

        setOrders(transformed);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const uniqueUsers = [...new Set(orders.map(order => order.user_name))].filter(Boolean);
  const uniquePuntosVenta = [...new Set(orders.map(order => order.config_name))].filter(Boolean);

  const filteredOrders = orders.filter(order => {
    const matchesUser = !selectedUser || order.user_name === selectedUser;
    const matchesPuntoVenta = !selectedPuntoVenta || order.config_name === selectedPuntoVenta;

    const orderDate = new Date(order.fecha);
    const orderDatePeru = new Date(orderDate.toLocaleString('en-US', { timeZone: 'America/Lima' }));

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const startAdjusted = start ? new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate(),
        5, 0, 0, 0
      )
    ) : null;

    const endAdjusted = end ? new Date(
      Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth(),
        end.getUTCDate(),
        28, 59, 59, 999
      )
    ) : null;

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

    return matchesUser && matchesPuntoVenta && matchesStart && matchesEnd && matchesSearch;
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

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(data, 'ventas_pos.xlsx');
  };

  return (
    <div className="app-container">
      <h1 className="title">Registro de Ventas Nota de Crédito en POS</h1>
      <div className="header-container">
        <div className="filters-container">
          <div className="filter-group">
            <label>Fecha desde:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <label>Fecha hasta:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              min={startDate}
            />
          </div>
          <div className="filter-group">
            <label>Usuario:</label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todos</option>
              {uniqueUsers.map((user, index) => (
                <option key={index} value={user}>{user}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Punto de Venta:</label>
            <select
              value={selectedPuntoVenta}
              onChange={(e) => {
                setSelectedPuntoVenta(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todos</option>
              {uniquePuntosVenta.map((punto, index) => (
                <option key={index} value={punto}>{punto}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="bigSearch">Buscar:</label>
            <div className="search-input-wrapper">
              <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                id="bigSearch"
                type="text"
                placeholder="Buscar Orden, Usuario, .."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
          <button onClick={exportToExcel} className="export-button">
            <svg
              viewBox="0 0 384 512"
              width="20"
              height="20"
              className="excel-icon"
              aria-hidden="true"
            >
              <path fill="currentColor" d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373c-6.4 14.8-10 20-36.6 68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.1-93.5-60.1-93.5c-5.1-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 20 35.4 36.6 68.8 0 0 6.1-11.7 36.6-68.8 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM160 72c0-4.4 3.6-8 8-8h64c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8h-64c-4.4 0-8-3.6-8-8V72z" />
            </svg>
            Exportar a Excel
          </button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Orden POS</th>
              <th>Usuario</th>
              <th>Punto de Venta</th>
              <th className="amount">Total</th>
              <th>Método de Pago</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map(order => (
              <tr key={`${order.id}-${order.fecha}`}>
                <td>{order.orden_pos}</td>
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
                <td>{new Date(order.fecha).toLocaleString('es-PE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &laquo; Anterior
          </button>

          {getPaginationRange().map((page, idx) =>
            typeof page === "string" ? (
              <span key={`dots-${idx}`} className="dots">...</span>
            ) : (
              <button
                key={page}
                className={page === currentPage ? 'active' : ''}
                onClick={() => handlePage(page)}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => handlePage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente &raquo;
          </button>
        </div>
      )}
    </div>
  );
};

export default App;