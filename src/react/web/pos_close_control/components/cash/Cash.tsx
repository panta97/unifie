import React from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectCashDenominations,
  selectSummary,
  updateCashDenom,
} from "../../app/slice/pos/posSlice";
import { ECashDenom } from "../../app/slice/pos/posType";
import { getOdooStateMessage, getStateMessage } from "../../shared";
import { getCurrencyFormat } from "../../utils";
import NumberInputBlank from "../input/NumberInputBlank";
import useRoveFocus from "../../../shared/hooks/useRoveFocus";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";

export const Cash = () => {
  const denoms = useAppSelector(selectCashDenominations);
  const summary = useAppSelector(selectSummary);
  const { mainSession, extraSessions } = useAppSelector((state: any) => state.pos);

  const { storedValue: includeBalanceStart } = useLocalStorage<boolean>("include-balance-start", true);

  const sessions = [
    ...(mainSession ? [mainSession] : []),
    ...(Array.isArray(extraSessions) ? extraSessions : []),
  ];
  const totalOdooCash = sessions.reduce((acc: number, s: any) => {
    const cash = s.odooCash || 0;
    const balance = s.balanceStart || 0;
    return acc + (includeBalanceStart ? cash : cash - balance);
  }, 0);

  const diff = summary.posCash - totalOdooCash;
  const [focus, setFocus] = useRoveFocus(11);
  const dispatch = useAppDispatch();

  const updateDenomination = (
    e: React.ChangeEvent<HTMLInputElement>,
    denom: ECashDenom
  ) => {
    let newAmount = Number(e.target.value);
    if (newAmount < 0) newAmount = 0;
    dispatch(updateCashDenom({ denom, amount: newAmount }));
  };

  return (
    <div>
      <table className="w-[400px] border-collapse border border-black">
        <thead>
          <tr>
            <th colSpan={3}>EFECTIVO EN CAJA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-2 w-1/3 text-center">
              DENOMINACION
            </td>
            <td className="border border-black px-2 w-1/3 text-center">
              CANTIDAD
            </td>
            <td className="border border-black px-2 w-1/3 text-center">
              TOTAL
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(0.1)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={0}
                focus={focus === 0}
                className="w-full"
                value={denoms.d0_10}
                onChange={(e) => updateDenomination(e, ECashDenom.d0_10)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d0_10 * 0.1)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(0.2)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={1}
                focus={focus === 1}
                className="w-full"
                value={denoms.d0_20}
                onChange={(e) => updateDenomination(e, ECashDenom.d0_20)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d0_20 * 0.2)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(0.5)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={2}
                focus={focus === 2}
                className="w-full"
                value={denoms.d0_50}
                onChange={(e) => updateDenomination(e, ECashDenom.d0_50)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d0_50 * 0.5)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(1)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={3}
                focus={focus === 3}
                className="w-full"
                value={denoms.d1_00}
                onChange={(e) => updateDenomination(e, ECashDenom.d1_00)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d1_00 * 1)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(2)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={4}
                focus={focus === 4}
                className="w-full"
                value={denoms.d2_00}
                onChange={(e) => updateDenomination(e, ECashDenom.d2_00)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d2_00 * 2)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(5)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={5}
                focus={focus === 5}
                className="w-full"
                value={denoms.d5_00}
                onChange={(e) => updateDenomination(e, ECashDenom.d5_00)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d5_00 * 5)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(10)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={6}
                focus={focus === 6}
                className="w-full"
                value={denoms.d10_00}
                onChange={(e) => updateDenomination(e, ECashDenom.d10_00)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d10_00 * 10)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(20)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={7}
                focus={focus === 7}
                className="w-full"
                value={denoms.d20_00}
                onChange={(e) => updateDenomination(e, ECashDenom.d20_00)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d20_00 * 20)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(50)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={8}
                focus={focus === 8}
                className="w-full"
                value={denoms.d50_00}
                onChange={(e) => updateDenomination(e, ECashDenom.d50_00)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d50_00 * 50)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(100)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={9}
                focus={focus === 9}
                className="w-full"
                value={denoms.d100_00}
                onChange={(e) => updateDenomination(e, ECashDenom.d100_00)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d100_00 * 100)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(200)}
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                setFocus={setFocus as (e: number) => void}
                index={10}
                focus={focus === 10}
                className="w-full"
                value={denoms.d200_00}
                onChange={(e) => updateDenomination(e, ECashDenom.d200_00)}
              />
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(denoms.d200_00 * 200)}
            </td>
          </tr>

          <tr>
            <td className="border border-black px-2 text-right" colSpan={2}>
              TOTAL CAJA
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(summary.posCash)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 text-right" colSpan={2}>
              TOTAL ODOO
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(totalOdooCash)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 text-right" colSpan={2}>
              DIFERENCIA
            </td>
            <td
              className={
                "border border-black px-2 text-right" +
                ` ${diff < 0 ? "text-red-500" : ""}`
              }
            >
              {getCurrencyFormat(Math.abs(diff))}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 text-right" colSpan={2}>
              ESTADO
            </td>
            <td className="border border-black px-2 text-right">
              {diff === 0
                ? "-"
                : `${getStateMessage(diff)} (${getOdooStateMessage(diff)})`}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
