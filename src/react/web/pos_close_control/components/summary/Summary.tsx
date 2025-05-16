import React, { useEffect, useState } from "react";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useGetEmployeesByTypeQuery } from "../../app/slice/employee/employeeSlice";
import {
  fetchPOSDetails,
  savePOSDetails,
  updateCashier,
  updateEndState,
  updateManager,
  fetchOdooSummaryById,
  mergeOdooSummary,
} from "../../app/slice/pos/posSlice";
import { endStates } from "../../data/data";
import { getDateFormat, getEndStateSpanish } from "../../shared";
import { getCurrencyFormat } from "../../utils";
import NumberInputBlank from "../input/NumberInputBlank";
import { Loader } from "../loader/Loader";
import { SummaryPrint } from "./SummaryPrint";

const Divider = () => {
  return (
    <tr>
      <td className="border border-black px-2 h-2 bg-black" colSpan={4} />
    </tr>
  );
};

export const Summary = () => {
  const posState = useAppSelector((root) => root.pos);
  const { storedValue: includeBalanceStart, setValue: setIncludeBalanceStart } = useLocalStorage<boolean>("include-balance-start", true);

  function parseIfString<T>(value: T | string): T {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value as T;
      }
    }
    return value;
  }

  const mainSession = parseIfString(posState.mainSession);
  const extraSessions = Array.isArray(posState.extraSessions)
    ? posState.extraSessions.map(parseIfString)
    : [];

  const totalOdooCash = (mainSession?.odooCash || 0)
    + extraSessions.reduce((acc, s) => acc + (s.odooCash || 0), 0)
    - (!includeBalanceStart
      ? ((mainSession?.balanceStart || 0)
        + extraSessions.reduce((acc, s) => acc + (s.balanceStart || 0), 0))
      : 0);

  const totalOdooCard =
    (mainSession?.odooCard || 0) +
    extraSessions.reduce((acc, s) => acc + (s.odooCard || 0), 0);
  const totalOdooCreditNote =
    (mainSession?.odooCreditNote || 0) +
    extraSessions.reduce((acc, s) => acc + (s.odooCreditNote || 0), 0);

  const summary = parseIfString(posState.summary);
  const isSessionClosed = summary.isSessionClosed;
  const posEndState = posState.endState;
  const [extraLines, setExtraLines] = React.useState<
    { id: string; isLoading: boolean }[]
  >([]);
  const addLine = () => {
    setExtraLines((lines) => [...lines, { id: "", isLoading: false }]);
  };
  const setLineId = (i: number, id: string) => {
    setExtraLines((lines) =>
      lines.map((l, idx) => (idx === i ? { ...l, id } : l))
    );
  };
  const setLineLoading = (i: number, isLoading: boolean) => {
    setExtraLines((lines) =>
      lines.map((l, idx) => (idx === i ? { ...l, isLoading } : l))
    );
  };
  const pos = posState.posName;
  const cashier = posState.cashier;
  const manager = posState.manager;
  const dispatch = useAppDispatch();
  const { data: managers, isLoading: managersLoading } =
    useGetEmployeesByTypeQuery("MN");
  const { data: cashiers, isLoading: cashiersLoading } =
    useGetEmployeesByTypeQuery("CA");

  const { storedValue: sessionId, setValue: setSessionId } =
    useLocalStorage<string>("r-state-session-id", "");

  const handleFetchPOSSession = () => {
    dispatch(fetchPOSDetails({ sessionId }));
  };

  const handleSavePOSSession = () => {
    if (!isSessionClosed) {
      alert("CERRAR CAJA");
      return;
    }
    dispatch(savePOSDetails({ posState }));
  };

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get("sessionId");
    if (sessionId) {
      setSessionId(sessionId);
      dispatch(fetchPOSDetails({ sessionId }));
    }
  }, []);

  const handleFetchExtraSessions = async () => {
    dispatch({ type: "POS/clearExtraSessions" });
    const codes = extraLines.map(l => l.id.trim()).filter(Boolean);
    await Promise.all(
      codes.map(async (code, i) => {
        setLineLoading(i, true);
        try {
          const [result, detailsResp] = await Promise.all([
            dispatch(fetchOdooSummaryById({ sessionId: code })),
            fetch(`/api/pos-close-control/get-pos-details/${code}`)
          ]);
          let sessionName = "";
          let balanceStart = 0;
          try {
            const detailsJson = await detailsResp.json();
            sessionName = detailsJson.body.session_name;
            balanceStart = detailsJson.body.balance_start || 0;
          } catch { }
          setLineLoading(i, false);
          if (fetchOdooSummaryById.fulfilled.match(result)) {
            const { cash, card, credit_note } = result.payload;
            dispatch(
              mergeOdooSummary({
                sessionId: code,
                odooCash: cash,
                odooCard: card,
                odooCreditNote: credit_note,
                sessionName,
                balanceStart,
              })
            );
          } else {
            alert("Error al traer la sesión " + code);
          }
        } catch {
          setLineLoading(i, false);
          alert("Error al traer la sesión " + code);
        }
      })
    );
  };

  return (
    <section>
      <table className="w-[450px] border-collapse border border-black">
        <thead>
          <tr>
            <th className="border border-black px-2 h-7 uppercase" colSpan={3}>
              {pos}
            </th>
            <th className="border border-black px-2 h-7 uppercase" colSpan={1}>
              <div className="flex items-center justify-end">
                <label htmlFor="include-balance-start" className="flex items-center cursor-pointer select-none">
                  <span className="mr-2 text-xs">Saldo inicial</span>
                  <span className="relative">
                    <input
                      type="checkbox"
                      id="include-balance-start"
                      checked={includeBalanceStart}
                      onChange={() => setIncludeBalanceStart(!includeBalanceStart)}
                      className="sr-only"
                    />
                    <span
                      className={
                        "block w-10 h-6 rounded-full transition-colors duration-200 " +
                        (includeBalanceStart ? "bg-green-500" : "bg-gray-400")
                      }
                    ></span>
                    <span
                      className={
                        "absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 " +
                        (includeBalanceStart ? "translate-x-4" : "translate-x-0")
                      }
                      style={{ border: "1px solid #888" }}
                    ></span>
                  </span>
                </label>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-2 w-1/2" colSpan={2}>
              ODOO
            </td>
            <td className="border border-black px-2 w-1/2" colSpan={2}>
              CAJA
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 w-1/4">EFECTIVO</td>
            <td className="border border-black px-2 w-1/4">
              {getCurrencyFormat(totalOdooCash)}
            </td>
            <td className="border border-black px-2 w-1/4">EFECTIVO</td>
            <td className="border border-black px-2 w-1/4">
              {getCurrencyFormat(summary.posCash)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 w-1/4">BCP</td>
            <td className="border border-black px-2 w-1/4">
              {getCurrencyFormat(totalOdooCard)}
            </td>
            <td className="border border-black px-2 w-1/4">BCP</td>
            <td className="border border-black px-2 w-1/4">
              {getCurrencyFormat(summary.posCard)}
            </td>
          </tr>
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              NOTA DE CREDITO
            </td>
          </tr>
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              {getCurrencyFormat(totalOdooCreditNote)}
            </td>
          </tr>
          <Divider />
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              INICIO
            </td>
          </tr>
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              {getCurrencyFormat(summary.balanceStart)}{" "}
            </td>
          </tr>
          <Divider />
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              <div className="flex justify-center gap-1 items-center relative">
                <button
                  type="button"
                  className="absolute right-3 -top-5 border border-black px-2 py-1 rounded-full text-lg leading-none flex items-center justify-center bg-white"
                  style={{ width: 28, height: 28 }}
                  onClick={addLine}
                  title="Agregar más"
                >
                  +
                </button>
                <button
                  type="button"
                  className="absolute right-[-20px] -top-5 border border-black px-2 py-1 rounded-full text-lg leading-none flex items-center justify-center bg-white"
                  style={{ width: 28, height: 28 }}
                  onClick={() => setExtraLines((lines) => lines.slice(0, -1))}
                  title="Quitar"
                  disabled={extraLines.length === 0}
                >
                  –
                </button>
                CODIGO DE SESION:
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (extraLines.length > 0) {
                      await handleFetchExtraSessions();
                    } else {
                      handleFetchPOSSession();
                    }
                  }}
                >
                  <input
                    onChange={(e) => setSessionId(e.target.value)}
                    value={sessionId}
                    className="w-[50px] border-black border-b-2 outline-none focus:border-blue-600"
                    type="text"
                  />
                  <button className="absolute right-10 top-[-1px] px-2 py-1 flex items-center justify-center">Buscar</button>
                </form>
              </div>
              {extraLines.map((line, i) => (
                <div key={i} className="flex justify-center gap-1 items-center mt-1">
                  CODIGO DE SESION:
                  <input
                    value={line.id}
                    onChange={(e) => setLineId(i, e.target.value)}
                    className="w-[50px] border-black border-b-2 outline-none focus:border-blue-600"
                    type="text"
                  />
                  <Loader fetchStatus={line.isLoading ? "loading" : "idle"} />
                </div>
              ))}
            </td>
          </tr>
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              {[
                summary.sessionName,
                ...(posState.extraSessions &&
                  Array.isArray(posState.extraSessions)
                  ? posState.extraSessions
                    .filter(
                      (s, idx, arr) =>
                        s.sessionName &&
                        s.sessionName !== summary.sessionName &&
                        arr.findIndex(
                          (x) => x.sessionId === s.sessionId
                        ) === idx
                    )
                    .map((s) => s.sessionName)
                  : [])
              ]
                .filter(Boolean)
                .join(" - ")}
            </td>
          </tr>
          <Divider />
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              FECHA DE APERTURA
            </td>
          </tr>
          <tr>
            <td
              className="border border-black px-2 text-center h-7 uppercase"
              colSpan={4}
            >
              {getDateFormat(summary.startAt)}
            </td>
          </tr>
          <Divider />
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              FECHA DE CIERRE
            </td>
          </tr>
          <tr>
            <td
              className={
                "border border-black px-2 text-center h-7 uppercase" +
                `${!isSessionClosed ? " text-red-600" : ""}`
              }
              colSpan={4}
            >
              {!isSessionClosed ? "NO CERRADO" : getDateFormat(summary.stopAt)}
            </td>
          </tr>
          <Divider />
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              CAJERO
            </td>
          </tr>
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              {!cashiersLoading && (
                <select
                  value={cashier.id}
                  onChange={(e) =>
                    dispatch(
                      updateCashier({
                        cashier: (cashiers ?? []).find(
                          (c) => c.id === Number(e.target.value)
                        )!,
                      })
                    )
                  }
                >
                  {(cashiers ?? []).map((cashier) => (
                    <option key={cashier.id} value={cashier.id}>
                      {cashier.first_name} {cashier.last_name}
                    </option>
                  ))}
                </select>
              )}
            </td>
          </tr>
          <Divider />
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              CUADRADO POR
            </td>
          </tr>
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              {!managersLoading && (
                <select
                  value={manager.id}
                  onChange={(e) =>
                    dispatch(
                      updateManager({
                        manager: (managers ?? []).find(
                          (c) => c.id === Number(e.target.value)
                        )!,
                      })
                    )
                  }
                >
                  {(managers ?? []).map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.first_name} {manager.last_name}
                    </option>
                  ))}
                </select>
              )}
            </td>
          </tr>
          <Divider />
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={2}
            >
              ESTADO
            </td>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={2}
            >
              MONTO
            </td>
          </tr>
          <tr
            className={`${posEndState.state === "missing" ? "text-red-500" : ""
              }`}
          >
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={2}
            >
              <select
                className="uppercase"
                value={posEndState.state}
                onChange={(e) => {
                  dispatch(updateEndState({ endState: e.target.value }));
                }}
              >
                {endStates.map((endState) => (
                  <option key={endState} value={endState}>
                    {getEndStateSpanish(endState)}
                  </option>
                ))}
              </select>
            </td>
            <td colSpan={2} className="px-2">
              {posEndState.state === "stable" ? (
                posEndState.amount
              ) : (
                <NumberInputBlank
                  min={0}
                  value={posEndState.amount}
                  onChange={(e) => {
                    let newAmount = e.target.valueAsNumber;
                    if (isNaN(newAmount)) newAmount = 0;
                    dispatch(updateEndState({ amount: newAmount }));
                  }}
                />
              )}
            </td>
          </tr>
          <Divider />
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              OBSERVACIÓN
            </td>
          </tr>
          <tr>
            <td colSpan={4}>
              <textarea
                className="px-2 py-1 w-full h-full uppercase resize-none"
                value={posEndState.note}
                onChange={(e) =>
                  dispatch(updateEndState({ note: e.target.value }))
                }
              />
            </td>
          </tr>
        </tbody>
      </table>
      {isSessionClosed && (
        <div className="w-[450px] flex justify-center mt-2">
          <button
            className="border border-black px-4 py-2 uppercase"
            onClick={handleSavePOSSession}
          >
            Guardar Cuadre
          </button>
        </div>
      )}
      <Loader fetchStatus={posState.savePOSStateStatus} />
      <Loader fetchStatus={posState.fetchPOSStateStatus} />
      <SummaryPrint includeBalanceStart={includeBalanceStart} />
    </section>
  );
};
