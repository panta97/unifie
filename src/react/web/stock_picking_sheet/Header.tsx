import React from "react";
import { HEADER_HEIGHT } from "./logic/constants";
import { IStockPickingDetailsGrouped } from "./logic/rowHandler";

interface HeaderProps {
  stock_details: IStockPickingDetailsGrouped;
  totalQty: number;
}

const getFirstName = (fullName: string) => {
  const nameWords = fullName.split(" ");
  if (nameWords.length > 2) return `${nameWords[0]} ${nameWords[1]}`;
  return fullName;
};

export const Header = ({ stock_details, totalQty }: HeaderProps) => {
  return (
    <div className="border-b border-black border-dashed mb-2">
      <h2 className="text-lg font-semibold">
        <span>{stock_details.name}</span>
      </h2>
      {stock_details.page === 1 && (
        <div className="uppercase">
          <div
            className="w-full inline-block pr-2"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            <table>
              <thead>
                <tr>
                  <td className="text-right font-semibold">
                    Ubicación Origen:
                  </td>
                  <td>{stock_details.location}</td>
                </tr>
                <tr>
                  <td className="text-right font-semibold">
                    Ubicación Destino:
                  </td>
                  <td>{stock_details.location_dest}</td>
                </tr>
                <tr>
                  <td className="w-[150px] text-right font-semibold">
                    Cantidad Total:
                  </td>
                  <td>{totalQty}</td>
                </tr>
              </thead>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
