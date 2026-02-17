import React, { useState, useEffect, useCallback } from "react";
import "./index.css";
import { Header } from "./components/Header";
import { LeftSection } from "./components/LeftSection";
import { RightSection } from "./components/RightSection";
import { SummaryPrint } from "./components/SummaryPrint";
import { LockScreen } from "./components/LockScreen";
import {
  fetchSessionData,
  fetchEmployees,
  submitPosCloseControl,
  updatePosCloseControl,
  autosavePosCloseControl,
  fetchSessionSnapshots,
  validateSession,
} from "./utils/api";
import { FIXED_BALANCE_START } from "./types";
import type {
  CashDenominations,
  CardAmounts,
  Employee,
  Summary as SummaryType,
  EndState,
  Snapshot,
} from "./types";
import { useAutosave } from "./hooks/useAutosave";
import { useInactivityTimer } from "./hooks/useInactivityTimer";

const OTP_TOKEN_KEY = "otp_token";

function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Read sessionId from URL query param
  const urlSessionId = new URLSearchParams(window.location.search).get("sessionId");

  // Session state
  const [sessionId, setSessionId] = useState<string>(urlSessionId || "");
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    posCash: number;
    posCard: number;
    status: string;
    difference: number;
  } | null>(null);
  const [isExistingSession, setIsExistingSession] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotCount, setSnapshotCount] = useState(0);

  // Lock handler
  const handleLock = useCallback(() => {
    sessionStorage.removeItem(OTP_TOKEN_KEY);
    setIsAuthenticated(false);
  }, []);

  // Validate existing token on mount
  useEffect(() => {
    const checkExistingToken = async () => {
      const token = sessionStorage.getItem(OTP_TOKEN_KEY);
      if (token) {
        try {
          const result = await validateSession(token);
          if (result.valid) {
            setIsAuthenticated(true);
            if (result.employee) {
              setSelectedManager(result.employee);
            }
          } else {
            sessionStorage.removeItem(OTP_TOKEN_KEY);
          }
        } catch {
          sessionStorage.removeItem(OTP_TOKEN_KEY);
        }
      }
      setAuthLoading(false);
    };

    checkExistingToken();
  }, []);

  // Listen for otp-session-expired events (from API 401 responses)
  useEffect(() => {
    const handleExpired = () => handleLock();
    window.addEventListener("otp-session-expired", handleExpired);
    return () =>
      window.removeEventListener("otp-session-expired", handleExpired);
  }, [handleLock]);

  // Inactivity timer - 10 minutes
  useInactivityTimer({
    timeoutMs: 600000,
    onTimeout: handleLock,
    enabled: isAuthenticated,
  });

  // Auto-fetch session from URL query param after authentication
  useEffect(() => {
    if (isAuthenticated && sessionId && summary.sessionId === 0) {
      handleFetchSession();
    }
  }, [isAuthenticated]);

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

  // Autosave setup
  const handleAutosave = useCallback(async () => {
    if (summary.sessionId === 0) {
      // No session loaded yet, don't autosave
      return;
    }

    try {
      const result = await autosavePosCloseControl(
        summary.sessionId,
        cashDenominations,
        cardAmounts
      );

      // If this was the first autosave, mark session as existing
      if (!isExistingSession && result.created) {
        setIsExistingSession(true);
      }
    } catch (err) {
      console.error("Autosave failed:", err);
      // Don't show error to user, just log it
      // The manual save will still work
    }
  }, [summary.sessionId, cashDenominations, cardAmounts, isExistingSession]);

  const { status: autosaveStatus, triggerAutosave } = useAutosave({
    onSave: handleAutosave,
    enabled: summary.sessionId !== 0, // Only enable after session is loaded
  });

  // Trigger autosave when denominations or card amounts change
  useEffect(() => {
    if (summary.sessionId !== 0) {
      triggerAutosave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cashDenominations, cardAmounts, summary.sessionId]);

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

      // Fetch snapshots for this session
      try {
        const snapshotData = await fetchSessionSnapshots(Number(sessionId));
        setSnapshots(snapshotData.snapshots);
        setSnapshotCount(snapshotData.snapshot_count);
      } catch (err) {
        console.error("Failed to fetch snapshots:", err);
        // Non-critical error, continue with session load
        setSnapshots([]);
        setSnapshotCount(0);
      }

      // Check if this session has been saved before
      if (data.savedSession) {
        setIsExistingSession(true);

        // Restore React state from saved session
        if (data.savedSession.cash_denominations) {
          // Ensure all denomination values are valid numbers
          const validDenoms = {
            d0_10: Number(data.savedSession.cash_denominations.d0_10) || 0,
            d0_20: Number(data.savedSession.cash_denominations.d0_20) || 0,
            d0_50: Number(data.savedSession.cash_denominations.d0_50) || 0,
            d1_00: Number(data.savedSession.cash_denominations.d1_00) || 0,
            d2_00: Number(data.savedSession.cash_denominations.d2_00) || 0,
            d5_00: Number(data.savedSession.cash_denominations.d5_00) || 0,
            d10_00: Number(data.savedSession.cash_denominations.d10_00) || 0,
            d20_00: Number(data.savedSession.cash_denominations.d20_00) || 0,
            d50_00: Number(data.savedSession.cash_denominations.d50_00) || 0,
            d100_00: Number(data.savedSession.cash_denominations.d100_00) || 0,
            d200_00: Number(data.savedSession.cash_denominations.d200_00) || 0,
          };
          setCashDenominations(validDenoms);
        }
        if (data.savedSession.card_amounts) {
          // Ensure all card amount values are valid numbers
          const validCards = {
            pos1: Number(data.savedSession.card_amounts.pos1) || 0,
            pos2: Number(data.savedSession.card_amounts.pos2) || 0,
            miscellaneous:
              Number(data.savedSession.card_amounts.miscellaneous) || 0,
          };
          setCardAmounts(validCards);
        }
        if (data.savedSession.observations) {
          setObservations(data.savedSession.observations);
        }

        // Restore cashier from saved session (manager comes from OTP auth)
        const savedCashier = cashiers.find(
          (c) => c.id === data.savedSession?.cashier?.id
        );
        if (savedCashier) setSelectedCashier(savedCashier);
      } else {
        // Reset to default state for new sessions
        setIsExistingSession(false);
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
        setSelectedCashier(null);
      }
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
      // Use PUT for existing sessions, POST for new ones
      const result = isExistingSession
        ? await updatePosCloseControl(summary.sessionId, dataToSave)
        : await submitPosCloseControl(summary.sessionId, dataToSave);

      console.log("Save result:", result);

      // If it was a new session, mark it as existing now
      if (!isExistingSession) {
        setIsExistingSession(true);
      }

      // Fetch updated snapshot history after successful save
      try {
        const snapshotData = await fetchSessionSnapshots(summary.sessionId);
        setSnapshots(snapshotData.snapshots);
        setSnapshotCount(snapshotData.snapshot_count);
      } catch (err) {
        console.error("Failed to fetch updated snapshots:", err);
        // Non-critical error, continue with save success
      }

      // Show success modal instead of alert
      setSuccessData({
        posCash,
        posCard,
        status: endState.state,
        difference,
      });
      setShowSuccessModal(true);
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

  const handleAuthenticated = (token: string, employee: Employee) => {
    setIsAuthenticated(true);
    setSelectedManager(employee);
  };

  console.log({ summary });

  // Show loading while checking existing token
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  // Show lock screen if not authenticated
  if (!isAuthenticated) {
    return (
      <LockScreen
        managers={managers}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <div className="p-3 max-w-screen-2xl mx-auto bg-slate-50 min-h-screen">
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg shadow-sm">
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
          snapshotCount={snapshotCount}
          snapshots={snapshots}
          onSessionIdChange={setSessionId}
          onFetchSession={handleFetchSession}
          onLock={handleLock}
        />

        <LeftSection
          denominations={cashDenominations}
          cardAmounts={cardAmounts}
          onDenominationChange={handleDenominationChange}
          onCardAmountChange={handleCardAmountChange}
          disabled={summary.sessionId === 0}
        />

        <RightSection
          odooCash={summary.odooCash}
          odooCard={summary.odooCard}
          odooCreditNote={summary.odooCreditNote}
          posCash={posCash}
          posCard={posCard}
          balanceStart={summary.balanceStart}
          isSessionClosed={summary.isSessionClosed}
          isExistingSession={isExistingSession}
          selectedManager={selectedManager}
          cashiers={cashiers}
          selectedCashier={selectedCashier}
          onCashierChange={handleCashierChange}
          observations={observations}
          onObservationsChange={setObservations}
          onSave={handleSave}
          onPrint={handlePrint}
          disabled={summary.sessionId === 0}
        />
      </div>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Guardado exitoso
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Total Efectivo:</span> S/.{" "}
                    {(successData.posCash / 100).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Total Tarjeta:</span> S/.{" "}
                    {(successData.posCard / 100).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Estado:</span>{" "}
                    <span className="uppercase font-semibold">
                      {successData.status}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Diferencia:</span> S/.{" "}
                    {(Math.abs(successData.difference) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-md text-sm font-semibold hover:shadow-lg transition-all duration-200"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Printer Summary Component */}
      <SummaryPrint
        summary={summary}
        cashier={selectedCashier}
        manager={selectedManager}
        posCash={posCash}
        posCard={posCard}
      />
    </div>
  );
}

export default App;
