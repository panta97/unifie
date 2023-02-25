import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchPOSDetails,
  savePOSDetails,
  updateCashier,
  updateEndState,
  updateManager,
} from "../../app/slice/pos/posSlice";
import { cashiers, endStates, managers } from "../../data/data";
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
  const isSessionClosed = posState.summary.isSessionClosed;
  const summary = posState.summary;
  const posEndState = posState.endState;
  const pos = posState.posName;
  const cashier = posState.cashier;
  const manager = posState.manager;
  const dispatch = useAppDispatch();
  const [sessionId, setSessionId] = useState("");

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

  return (
    <section>
      <table className="w-[450px] border-collapse border border-black">
        <thead>
          <tr>
            <th className="border border-black px-2 h-7 uppercase" colSpan={4}>
              {pos}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-2 w-1/2" colSpan={2}></td>
            <td className="border border-black px-2 w-1/2" colSpan={2}>
              CAJA
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 w-1/4">EFECTIVO</td>
            <td className="border border-black px-2 w-1/4">
              {getCurrencyFormat(summary.odooCash)}
            </td>
            <td className="border border-black px-2 w-1/4">EFECTIVO</td>
            <td className="border border-black px-2 w-1/4">
              {getCurrencyFormat(summary.posCash)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 w-1/4">BCP</td>
            <td className="border border-black px-2 w-1/4">
              {getCurrencyFormat(summary.odooCard)}
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
              <div className="flex justify-center gap-1">
                CODIGO DE SESION:
                <input
                  onChange={(e) => setSessionId(e.target.value)}
                  value={sessionId}
                  className="w-[50px] border-black border-b-2 outline-none focus:border-blue-600"
                  type={"text"}
                ></input>
                <button onClick={handleFetchPOSSession}>Buscar</button>
              </div>
            </td>
          </tr>
          <tr>
            <td
              className="border border-black px-2 text-center h-7"
              colSpan={4}
            >
              {summary.sessionName}
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
              <select
                value={cashier.id}
                onChange={(e) =>
                  dispatch(updateCashier({ cashierId: Number(e.target.value) }))
                }
              >
                {cashiers.map((cashier) => (
                  <option key={cashier.id} value={cashier.id}>
                    {cashier.name}
                  </option>
                ))}
              </select>
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
              <select
                value={manager.id}
                onChange={(e) =>
                  dispatch(updateManager({ managerId: Number(e.target.value) }))
                }
              >
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
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
            className={`${
              posEndState.state === "missing" ? "text-red-500" : ""
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
      <SummaryPrint />
    </section>
  );
};
