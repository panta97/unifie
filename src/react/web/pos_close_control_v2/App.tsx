import React, { useState, useEffect } from "react";
import "./index.css";
import { Header } from "./components/Header";
import { LeftSection } from "./components/LeftSection";
import { RightSection } from "./components/RightSection";
import {
  fetchSessionData,
  fetchEmployees,
  submitPosCloseControl,
} from "./utils/api";
import { FIXED_BALANCE_START } from "./types";
import type {
  CashDenominations,
  CardAmounts,
  Employee,
  Summary as SummaryType,
  EndState,
} from "./types";

function App() {
  // Session state
  const [sessionId, setSessionId] = useState<string>("");
  const [summary, setSummary] = useState<SummaryType>({
    sessionId: 0,
    configId: 0,
    configDisplayName: "",
    sessionName: "",
    posName: "",
    startAt: "",
    stopAt: "",
    isSessionClosed: false,
    balanceStart: 0,
    odooCash: 0,
    odooCard: 0,
    odooCreditNote: 0,
    posCash: 0,
    posCard: 0,
    profitTotal: 0,
    balanceStartNextDay: 0,
  });

  // Cash denominations state (quantities)
  const [cashDenominations, setCashDenominations] = useState<CashDenominations>(
    {
      d0_10: 0,
      d0_20: 0,
      d0_50: 0,
      d1_00: 0,
      d2_00: 0,
      d5_00: 0,
      d10_00: 0,
      d20_00: 0,
      d50_00: 0,
      d100_00: 0,
      d200_00: 0,
    }
  );

  // Card amounts state (in cents)
  const [cardAmounts, setCardAmounts] = useState<CardAmounts>({
    pos1: 0,
    pos2: 0,
    miscellaneous: 0,
  });

  // Observations state
  const [observations, setObservations] = useState<string>("");

  // Employee states
  const [cashiers, setCashiers] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [selectedCashier, setSelectedCashier] = useState<Employee | null>(null);
  const [selectedManager, setSelectedManager] = useState<Employee | null>(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees on mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const [cashiersData, managersData] = await Promise.all([
          fetchEmployees("cashier"),
          fetchEmployees("manager"),
        ]);
        setCashiers(cashiersData);
        setManagers(managersData);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        setError("Could not load employees. Please refresh the page.");
      }
    };

    loadEmployees();
  }, []);

  // Calculate total cash from denominations (in cents)
  const calculateTotalCash = () => {
    const denoms = cashDenominations;
    return (
      denoms.d0_10 * 10 +
      denoms.d0_20 * 20 +
      denoms.d0_50 * 50 +
      denoms.d1_00 * 100 +
      denoms.d2_00 * 200 +
      denoms.d5_00 * 500 +
      denoms.d10_00 * 1000 +
      denoms.d20_00 * 2000 +
      denoms.d50_00 * 5000 +
      denoms.d100_00 * 10000 +
      denoms.d200_00 * 20000
    );
  };

  // Calculate total card (in cents)
  const calculateTotalCard = () => {
    return cardAmounts.pos1 + cardAmounts.pos2 + cardAmounts.miscellaneous;
  };

  // Update cash in summary when denominations change
  const posCash = calculateTotalCash();
  const posCard = calculateTotalCard();

  // Calculate profit total
  const profitTotal = posCash + posCard - summary.odooCash - summary.odooCard;

  // Handlers
  const handleFetchSession = async () => {
    if (!sessionId) {
      setError("Please enter a session ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchSessionData(Number(sessionId));
      setSummary(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch session data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDenominationChange = (
    denom: keyof CashDenominations,
    quantity: number
  ) => {
    setCashDenominations((prev) => ({
      ...prev,
      [denom]: Math.max(0, quantity),
    }));
  };

  const handleCardAmountChange = (field: keyof CardAmounts, amount: number) => {
    setCardAmounts((prev) => ({
      ...prev,
      [field]: Math.max(0, amount),
    }));
  };

  const handleCashierChange = (cashierId: number) => {
    const cashier = cashiers.find((c) => c.id === cashierId);
    setSelectedCashier(cashier || null);
  };

  const handleManagerChange = (managerId: number) => {
    const manager = managers.find((m) => m.id === managerId);
    setSelectedManager(manager || null);
  };

  const handleSave = async () => {
    // Validation
    if (!selectedCashier) {
      alert("Please select a cashier");
      return;
    }
    if (!selectedManager) {
      alert("Please select a manager");
      return;
    }
    if (summary.sessionId === 0) {
      alert("Please fetch a session first");
      return;
    }

    // Calculate end state
    const odooTotal = summary.odooCash + summary.odooCard;
    const cajaTotal = posCash + posCard;
    const difference = cajaTotal - odooTotal;

    let endState: EndState;
    if (difference < 0) {
      endState = {
        state: "missing",
        amount: Math.abs(difference),
        note: observations,
      };
    } else if (difference > 0) {
      endState = {
        state: "extra",
        amount: Math.abs(difference),
        note: observations,
      };
    } else {
      endState = {
        state: "stable",
        amount: 0,
        note: observations,
      };
    }

    // Prepare data for save
    const dataToSave = {
      summary: {
        ...summary,
        posCash,
        posCard,
        profitTotal,
        balanceStartNextDay: FIXED_BALANCE_START,
      },
      cashDenominations,
      cardAmounts,
      endState,
      cashier: selectedCashier,
      manager: selectedManager,
    };

    setLoading(true);
    setError(null);

    try {
      const result = await submitPosCloseControl(summary.sessionId, dataToSave);
      console.log("Save result:", result);
      alert(
        "POS Close Control saved successfully!\n\n" +
        `Total Cash: S/. ${(posCash / 100).toFixed(2)}\n` +
        `Total Card: S/. ${(posCard / 100).toFixed(2)}\n` +
        `Status: ${endState.state.toUpperCase()}\n` +
        `Difference: S/. ${(Math.abs(difference) / 100).toFixed(2)}`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save POS close control";
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  console.log({ summary });

  return (
    <div className="p-3 max-w-screen-2xl mx-auto bg-gray-50 min-h-screen">
      {error && (
        <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-[2fr_3fr] grid-rows-[auto_1fr] gap-3 h-[calc(100vh-24px)]">
        <Header
          sessionId={sessionId}
          sessionName={summary.sessionName}
          configDisplayName={summary.configDisplayName}
          posName={summary.posName}
          startAt={summary.startAt}
          stopAt={summary.stopAt}
          isSessionClosed={summary.isSessionClosed}
          loading={loading}
          onSessionIdChange={setSessionId}
          onFetchSession={handleFetchSession}
        />

        <LeftSection
          denominations={cashDenominations}
          cardAmounts={cardAmounts}
          onDenominationChange={handleDenominationChange}
          onCardAmountChange={handleCardAmountChange}
        />

        <RightSection
          odooCash={summary.odooCash}
          odooCard={summary.odooCard}
          odooCreditNote={summary.odooCreditNote}
          posCash={posCash}
          posCard={posCard}
          balanceStart={summary.balanceStart}
          isSessionClosed={summary.isSessionClosed}
          managers={managers}
          selectedManager={selectedManager}
          onManagerChange={handleManagerChange}
          cashiers={cashiers}
          selectedCashier={selectedCashier}
          onCashierChange={handleCashierChange}
          observations={observations}
          onObservationsChange={setObservations}
          onSave={handleSave}
        />
      </div>

      <div className="print:hidden mt-4 text-center">
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none rounded-md cursor-pointer text-sm font-semibold uppercase tracking-wide transition-all duration-200 shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          disabled={loading}
        >
          {loading ? "LOADING..." : "IMPRIMIR"}
        </button>
      </div>
    </div>
  );
}

export default App;
