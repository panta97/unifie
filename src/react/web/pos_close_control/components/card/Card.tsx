import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectCardDenominations,
  selectSummary,
  updateCardDenom,
} from "../../app/slice/pos/posSlice";
import { ECardDenom } from "../../app/slice/pos/posType";
import { getStateMessage } from "../../shared";
import { getCurrencyFormat } from "../../utils";
import NumberInputBlank from "../input/NumberInputBlank";

export const Card = () => {
  const denoms = useAppSelector(selectCardDenominations);
  const summary = useAppSelector(selectSummary);
  const diff = summary.posCard - summary.odooCard;

  const dispatch = useAppDispatch();

  const updateDenomination = (
    e: React.ChangeEvent<HTMLInputElement>,
    denom: ECardDenom
  ) => {
    let newAmount = Number(e.target.value);
    if (newAmount < 0 && denom !== ECardDenom.miscellaneous) newAmount = 0;
    dispatch(updateCardDenom({ denom, amount: newAmount }));
  };

  return (
    <div>
      <table className="w-[400px] border-collapse border border-black">
        <tbody>
          <tr>
            <td className="border border-black px-2 text-right w-1/2">POS 1</td>
            <td className="border border-black px-2 text-right w-1/2">
              <NumberInputBlank
                className="w-full"
                value={denoms.pos1}
                onChange={(e) => updateDenomination(e, ECardDenom.pos1)}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 text-right">POS 2</td>
            <td className="border border-black px-2 text-right">
              <NumberInputBlank
                className="w-full"
                value={denoms.pos2}
                onChange={(e) => updateDenomination(e, ECardDenom.pos2)}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 text-right">OTROS</td>
            <td className="border border-black px-2 text-right">
              <NumberInputBlank
                className="w-full"
                value={denoms.miscellaneous}
                onChange={(e) =>
                  updateDenomination(e, ECardDenom.miscellaneous)
                }
              />
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 text-right">
              TOTAL TARJETA
            </td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(summary.posCard)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 text-right">TOTAL ODOO</td>
            <td className="border border-black px-2 text-right">
              {getCurrencyFormat(summary.odooCard)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 text-right">DIFERENCIA</td>
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
            <td className="border border-black px-2 text-right">ESTADO</td>
            <td className="border border-black px-2 text-right">
              {getStateMessage(diff)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
