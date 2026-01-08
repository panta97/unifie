import React, { useState } from "react";
import "./index.css";
import { Header } from "./components/Header";
import { LeftSection } from "./components/LeftSection";
import { RightSection } from "./components/RightSection";
import { mockCashiers, mockManagers, mockSessionData } from "./utils/mockData";
import type {
  CashDenominations,
  CardAmounts,
  Employee,
  Summary as SummaryType,
} from "./types";

const FIXED_BALANCE_START = 20000; // 200.00 in cents

function App() {
  // Session state
  const [sessionId, setSessionId] = useState<string>("");
  const [summary, setSummary] = useState<SummaryType>({
    sessionId: 0,
    sessionName: "",
    posName: "",
    startAt: "",
    stopAt: "",
    isSessionClosed: false,
    balanceStart: 0,
    odooCash: 90000,
    odooCard: 80000,
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

  // Employee state
  const [selectedCashier, setSelectedCashier] = useState<Employee | null>(null);

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

  // Handlers
  const handleFetchSession = () => {
    // Mock data fetch
    console.log("Fetching session:", sessionId);
    setSummary({
      ...mockSessionData,
      posCash: 0,
      posCard: 0,
      profitTotal: 0,
      balanceStartNextDay: 0,
    });
    // Reset denominations and card amounts
    setCashDenominations({
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
    });
    setCardAmounts({
      pos1: 0,
      pos2: 0,
      miscellaneous: 0,
    });
    setObservations("");
    alert("Session data loaded successfully!");
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
    const cashier = mockCashiers.find((c) => c.id === cashierId);
    setSelectedCashier(cashier || null);
  };

  const handleSave = () => {
    // Prepare data for save
    const dataToSave = {
      summary: {
        ...summary,
        posCash,
        posCard,
      },
      cashDenominations,
      cardAmounts,
      observations,
      cashier: selectedCashier,
    };

    console.log("Saving POS session data:", dataToSave);
    alert(
      "POS Close Control saved successfully!\n\n" +
      `Total Cash: S/. ${(posCash / 100).toFixed(2)}\n` +
      `Total Card: S/. ${(posCard / 100).toFixed(2)}\n` +
      `Observations: ${observations}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-3 max-w-screen-2xl mx-auto bg-gray-50 min-h-screen">
      <div className="grid grid-cols-[2fr_3fr] grid-rows-[auto_1fr] gap-3 h-[calc(100vh-24px)]">
        <Header
          sessionId={sessionId}
          sessionName={summary.sessionName}
          posName={summary.posName}
          startAt={summary.startAt}
          stopAt={summary.stopAt}
          isSessionClosed={summary.isSessionClosed}
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
          cashiers={mockCashiers}
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
        >
          IMPRIMIR
        </button>
      </div>
    </div>
  );
}

export default App;
