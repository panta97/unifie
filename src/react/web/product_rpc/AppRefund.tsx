import React from 'react';
import "./App.css";
import { Login } from "./components/login/Login";
import Refund from "./components/refund/Refund";
import { useToken } from "./hooks/useToken";

function AppRefund() {
  const { token, setToken } = useToken();
  if (!token) return <Login setToken={setToken} />;
  return (
    <div>
      <Refund />
    </div>
  );
}

export default AppRefund;
