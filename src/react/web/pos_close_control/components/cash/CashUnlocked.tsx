import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectCashDenominations,
  selectSummary,
  updateCashDenom,
} from "../../app/slice/pos/posSlice";
import { ECashDenom } from "../../app/slice/pos/posType";
import { getCurrencyFormat } from "../../utils";
import NumberInputBlank from "../input/NumberInputBlank";

export const CashUnlocked = () => {
  const denoms = useAppSelector(selectCashDenominations);
  const summary = useAppSelector(selectSummary);

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
        </tbody>
      </table>
    </div>
  );
};
