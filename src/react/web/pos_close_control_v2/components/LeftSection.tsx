import React from "react";
import { formatCurrency } from "../utils/formatters";
import type { CashDenominations, CardAmounts } from "../types";

interface LeftSectionProps {
  denominations: CashDenominations;
  cardAmounts: CardAmounts;
  onDenominationChange: (
    denom: keyof CashDenominations,
    quantity: number
  ) => void;
  onCardAmountChange: (field: keyof CardAmounts, amount: number) => void;
}

const denominationValues: Array<{
  key: keyof CashDenominations;
  value: number;
  label: string;
}> = [
  { key: "d0_10", value: 0.1, label: "0.10" },
  { key: "d0_20", value: 0.2, label: "0.20" },
  { key: "d0_50", value: 0.5, label: "0.50" },
  { key: "d1_00", value: 1, label: "1.00" },
  { key: "d2_00", value: 2, label: "2.00" },
  { key: "d5_00", value: 5, label: "5.00" },
  { key: "d10_00", value: 10, label: "10.00" },
  { key: "d20_00", value: 20, label: "20.00" },
  { key: "d50_00", value: 50, label: "50.00" },
  { key: "d100_00", value: 100, label: "100.00" },
  { key: "d200_00", value: 200, label: "200.00" },
];

export const LeftSection: React.FC<LeftSectionProps> = ({
  denominations,
  cardAmounts,
  onDenominationChange,
  onCardAmountChange,
}) => {
  // Calculate total cash (in cents)
  const totalCash = denominationValues.reduce((sum, { key, value }) => {
    return sum + denominations[key] * value * 100;
  }, 0);

  // Calculate total card (in cents)
  const totalCard =
    cardAmounts.pos1 + cardAmounts.pos2 + cardAmounts.miscellaneous;

  return (
    <div className="col-start-1 row-start-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto flex flex-col">
      {/* Efectivo Section */}
      <div className="bg-white overflow-hidden border-b-2 border-gray-200">
        <div className="font-semibold text-sm text-center py-2.5 px-4 bg-gradient-to-br from-slate-600 to-slate-700 text-white uppercase tracking-wide m-0 rounded-t-lg">
          EFECTIVO EN CAJA
        </div>
        <table className="w-full border-collapse text-sm m-0 px-4 py-3">
          <thead>
            <tr>
              <th className="w-1/3 bg-gray-50 font-semibold text-center uppercase text-[11px] tracking-wide text-slate-600 border-none px-2.5 py-1.5">
                DENOMINACION
              </th>
              <th className="w-1/3 bg-gray-50 font-semibold text-center uppercase text-[11px] tracking-wide text-slate-600 border-none px-2.5 py-1.5">
                CANTIDAD
              </th>
              <th className="w-1/3 bg-gray-50 font-semibold text-center uppercase text-[11px] tracking-wide text-slate-600 border-none px-2.5 py-1.5">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {denominationValues.map(({ key, value, label }) => {
              const quantity = denominations[key];
              const total = quantity * value * 100; // in cents

              return (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="text-right font-mono text-sm px-2.5 py-1.5 border-b border-gray-100">
                    {formatCurrency(value * 100)}
                  </td>
                  <td className="px-2.5 py-1.5 text-left border-b border-gray-100">
                    <input
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) =>
                        onDenominationChange(
                          key,
                          parseInt(e.target.value || "0", 10)
                        )
                      }
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm transition-all duration-200 text-right font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </td>
                  <td className="text-right font-mono text-sm px-2.5 py-1.5 border-b border-gray-100">
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={2} className="text-right px-2.5 py-1.5 border-b-0">
                <strong className="text-slate-800">TOTAL</strong>
              </td>
              <td className="text-right font-mono text-sm px-2.5 py-1.5 border-b-0">
                <strong className="text-slate-800">
                  {formatCurrency(totalCash)}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tarjeta Section */}
      <div className="bg-white overflow-hidden">
        <div className="font-semibold text-sm text-center py-2.5 px-4 bg-gradient-to-br from-slate-600 to-slate-700 text-white uppercase tracking-wide m-0">
          TARJETA
        </div>
        <table className="w-full border-collapse text-sm m-0 px-4 py-3">
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="w-1/2 text-right px-2.5 py-1.5 border-b border-gray-100">
                <strong className="text-slate-800">POS 1</strong>
              </td>
              <td className="w-1/2 px-2.5 py-1.5 text-left border-b border-gray-100">
                <input
                  type="number"
                  value={cardAmounts.pos1 / 100}
                  onChange={(e) =>
                    onCardAmountChange(
                      "pos1",
                      Math.round(parseFloat(e.target.value || "0") * 100)
                    )
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm transition-all duration-200 text-right font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="text-right px-2.5 py-1.5 border-b border-gray-100">
                <strong className="text-slate-800">POS 2</strong>
              </td>
              <td className="px-2.5 py-1.5 text-left border-b border-gray-100">
                <input
                  type="number"
                  value={cardAmounts.pos2 / 100}
                  onChange={(e) =>
                    onCardAmountChange(
                      "pos2",
                      Math.round(parseFloat(e.target.value || "0") * 100)
                    )
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm transition-all duration-200 text-right font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="text-right px-2.5 py-1.5 border-b border-gray-100">
                <strong className="text-slate-800">OTROS</strong>
              </td>
              <td className="px-2.5 py-1.5 text-left border-b border-gray-100">
                <input
                  type="number"
                  value={cardAmounts.miscellaneous / 100}
                  onChange={(e) =>
                    onCardAmountChange(
                      "miscellaneous",
                      Math.round(parseFloat(e.target.value || "0") * 100)
                    )
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm transition-all duration-200 text-right font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </td>
            </tr>
            <tr>
              <td className="text-right px-2.5 py-1.5 border-b-0">
                <strong className="text-slate-800">TOTAL</strong>
              </td>
              <td className="text-right font-mono text-sm px-2.5 py-1.5 border-b-0">
                <strong className="text-slate-800">
                  {formatCurrency(totalCard)}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
