import React from "react";
import NavBar from "./components/NavBar";
import NavBarAdmin from "./components/NavBarAdmin";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Summary } from "./components/summary/Summary";
import { Cash } from "./components/cash/Cash";
import { Card } from "./components/card/Card";
import { Discount } from "./components/discount/Discount";
import { BalanceStart } from "./components/balance_start/BalanceStart";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import {
  selectLockedSince,
  updateSecurity,
} from "./app/slice/security/securitySlice";
import { LOCKAFTER_TIME } from "./app/slice/security/config";
import { CashUnlocked } from "./components/cash/CashUnlocked";
import {
  fetchPOSDetails,
  setFetchStatusesToIdle,
} from "./app/slice/pos/posSlice";
import { DiscountInvoices } from "./components/discount_invoices/DiscountInvoices";

// Componente para la página principal de admin
const AdminHome = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Panel de Administración</h2>
      <p>Bienvenido al panel de administración de POS.</p>
      <div className="mt-4">
        <p>Funciones disponibles:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Gestión de descuentos</li>
          <li>Configuraciones avanzadas</li>
        </ul>
      </div>
    </div>
  );
};

function App() {
  const lockedSince = useAppSelector(selectLockedSince);
  const dispatch = useAppDispatch();
  
  // Detectar si estamos en ruta admin
  const isAdminRoute = window.location.pathname.includes('/pos-close-control-admin');
  const basePath = isAdminRoute ? "/apps/pos-close-control-admin" : "/apps/pos-close-control";

  useEffect(() => {
    dispatch(setFetchStatusesToIdle());
    const currentTime = new Date().getTime();
    if (currentTime - lockedSince > LOCKAFTER_TIME) {
      dispatch(updateSecurity({ isLocked: true, lockedSince: 0 }));
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentTime = new Date().getTime();
      if (currentTime - lockedSince > LOCKAFTER_TIME) {
        dispatch(updateSecurity({ isLocked: true, lockedSince: 0 }));
      }
    }, 60 * 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [lockedSince]);

  return (
    <Router>
      <div className="my-2 mx-4 mt-0 font-mono">
        {/* Usar NavBar diferente según la ruta */}
        {isAdminRoute ? <NavBarAdmin /> : <NavBar />}
        
        <Routes>
          {/* Rutas normales */}
          <Route path="/apps/pos-close-control" element={<Summary />} />
          <Route path="/apps/pos-close-control/cash" element={<Cash />} />
          <Route path="/apps/pos-close-control/card" element={<Card />} />
          <Route path="/apps/pos-close-control/balance-start" element={<BalanceStart />} />
          <Route path="/apps/pos-close-control/discount-invoices" element={<DiscountInvoices />} />
          <Route path="/apps/pos-close-control/cash-unlocked" element={<CashUnlocked />} />
          
          {/* Rutas admin */}
          <Route path="/apps/pos-close-control-admin" element={<AdminHome />} />
          <Route path="/apps/pos-close-control-admin/discount" element={<Discount />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;