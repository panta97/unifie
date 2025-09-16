import React from "react";
import NavBar from "./components/NavBar";
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

function App() {
  const lockedSince = useAppSelector(selectLockedSince);
  const dispatch = useAppDispatch();
  const basePath = "/apps/pos-close-control";

  useEffect(() => {
    dispatch(setFetchStatusesToIdle());
    // dispatch(fetchPOSDetails());
    const currentTime = new Date().getTime();
    if (currentTime - lockedSince > LOCKAFTER_TIME) {
      dispatch(updateSecurity({ isLocked: true, lockedSince: 0 }));
    }
  }, []);

  useEffect(() => {
    // runs every minute
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
        <NavBar />
        <Routes>
          <Route path={basePath} element={<Summary />} />
          <Route path={`${basePath}/cash`} element={<Cash />} />
          <Route path={`${basePath}/card`} element={<Card />} />
          <Route
            path={`${basePath}/balance-start`}
            element={<BalanceStart />}
          />
          {/* <Route path={`${basePath}/discount`} element={<Discount />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
