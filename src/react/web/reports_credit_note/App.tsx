import React, { useEffect, useState } from "react";
import './styles/App.css';

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

const App: React.FC = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error('Error HTTP: ' + response.status);
        const data = await response.json();

        if (!data.orders || !Array.isArray(data.orders)) {
          throw new Error('Formato de datos inválido');
        }

        const transformedOrders = data.orders.map((order: any) => ({
          id: order.id,
          orden_pos: order.orden_pos || 'N/A',
          user_name: order.user_name || 'Desconocido',
          config_name: order.config_name || 'Desconocido',
          nota_credito_id: order.nota_credito_id || 0,
          total: order.total || 0,
          fecha: order.fecha || new Date().toISOString(),
          metodos_pago: order.metodos_pago || []
        }));

        setOrders(transformedOrders);
      } catch (err: any) {
        setError(err.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="app-container">
      <h1 className="title">Registro de Ventas Nota de Crédito en POS</h1>
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
            {orders.map(order => (
              <tr key={`${order.orden_pos}-${order.fecha}`}>
                <td>{order.orden_pos}</td>
                <td>{order.user_name}</td>
                <td>{order.config_name}</td>
                <td className="amount">S/ {order.total.toFixed(2)}</td>
                <td>
                  <ul className="payment-list">
                    {order.metodos_pago.map((metodo, idx) => (
                      <li key={idx}>
                        <span className="method">{metodo}</span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td>{new Date(order.fecha).toLocaleString('es-PE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
