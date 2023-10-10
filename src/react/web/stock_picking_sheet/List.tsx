import React from "react";
import { HEADER_HEIGHT, LINE_HEIGHT, PADDING_HEIGHT } from "./logic/constants";
import {
  IStockMoveLineGrouped,
  IStockPickingDetailsGrouped,
} from "./logic/rowHandler";

interface ListProps {
  stock_details: IStockPickingDetailsGrouped;
  stock_lines: IStockMoveLineGrouped[];
}

export const List = ({ stock_details, stock_lines }: ListProps) => {
  return (
    <div
      className="text-xs border-b border-black border-dashed mb-2"
      style={{
        height: `${850 + (stock_details.page === 1 ? 0 : HEADER_HEIGHT + 5)}px`,
      }}
    >
      <div className="font-semibold">
        <span className="border-l border-t border-r border-b border-black p-1 inline-block w-[80%]">
          DESCRIPCIÓN
        </span>
        <span className="border-t border-r border-b border-black p-1 inline-block w-[10%]">
          COSTO
        </span>
        <span className="border-t border-r border-b border-black p-1 inline-block w-[10%]">
          CANTIDAD
        </span>
      </div>
      {stock_lines.map((line, idx) => (
        <div
          key={idx}
          className="flex even:bg-gray-200"
          style={{
            height: `${LINE_HEIGHT * line.lineHeight + PADDING_HEIGHT}px`,
          }}
        >
          <div className="border-l border-r border-b border-black p-1 inline-flex items-center break-all w-[80%]">
            <span className="">{line.product_name}</span>
          </div>
          <div className="border-r border-b border-black p-1 inline-flex items-center break-all w-[10%]">
            <span className="">{line.product_cost}</span>
          </div>
          <div className="border-r border-b border-black p-1 inline-flex items-center w-[10%]">
            <span className="">{line.qty_done}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
