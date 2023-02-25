import { useAppSelector } from "../../app/hooks";
import { selectCashDenominations } from "../../app/slice/pos/posSlice";
import { getCurrencyFormat } from "../../utils";
import { BalanceStartPrint } from "./BalanceStartPrint";

export const BalanceStart = () => {
  const denoms = useAppSelector(selectCashDenominations);
  const bsnd = useAppSelector((root) => root.pos.summary.balanceStartNextDay);
  const profitTotal = useAppSelector((root) => root.pos.summary.profitTotal);

  return (
    <section>
      <div className="flex space-x-2">
        <table className="w-[400px] border-collapse border border-black">
          <thead>
            <tr>
              <th colSpan={3}>INICIO SIGUIENTE DIA</th>
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
              <td className="border border-black px-2">{denoms.d0_10}</td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(denoms.d0_10 * 0.1)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0.2)}
              </td>
              <td className="border border-black px-2">{denoms.d0_20}</td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(denoms.d0_20 * 0.2)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0.5)}
              </td>
              <td className="border border-black px-2">{denoms.d0_50}</td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(denoms.d0_50 * 0.5)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(1)}
              </td>
              <td className="border border-black px-2">{denoms.d1_00}</td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(denoms.d1_00 * 1)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(2)}
              </td>
              <td className="border border-black px-2">{denoms.d2_00}</td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(denoms.d2_00 * 2)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(5)}
              </td>
              <td className="border border-black px-2">{denoms.d5_00}</td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(denoms.d5_00 * 5)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(10)}
              </td>
              <td className="border border-black px-2">
                {Math.min(denoms.d10_00, 20)}
              </td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(Math.min(denoms.d10_00, 20) * 10)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(20)}
              </td>
              <td className="border border-black px-2">
                {Math.min(denoms.d20_00, 20)}
              </td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(Math.min(denoms.d20_00, 20) * 20)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(50)}
              </td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(100)}
              </td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(200)}
              </td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right" colSpan={2}>
                TOTAL
              </td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(bsnd)}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="w-[400px] border-collapse border border-black">
          <thead>
            <tr>
              <th colSpan={3}>CANTIDAD EN EL SOBRE</th>
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
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0.2)}
              </td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0.5)}
              </td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(1)}
              </td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(2)}
              </td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(5)}
              </td>
              <td className="border border-black px-2"></td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(0)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(10)}
              </td>
              <td className="border border-black px-2">
                {Math.max(denoms.d10_00 - 20, 0)}
              </td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(Math.max(denoms.d10_00 - 20, 0) * 10)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(20)}
              </td>
              <td className="border border-black px-2">
                {Math.max(denoms.d20_00 - 20, 0)}
              </td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(Math.max(denoms.d20_00 - 20, 0) * 20)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(50)}
              </td>
              <td className="border border-black px-2">{denoms.d50_00}</td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(denoms.d50_00 * 50)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(100)}
              </td>
              <td className="border border-black px-2">{denoms.d100_00}</td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(denoms.d100_00 * 100)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(200)}
              </td>
              <td className="border border-black px-2">{denoms.d200_00}</td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(denoms.d200_00 * 200)}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 text-right" colSpan={2}>
                TOTAL
              </td>
              <td className="border border-black px-2 text-right">
                {getCurrencyFormat(profitTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <BalanceStartPrint />
    </section>
  );
};
