import React from "react";
import { IStockGrouped } from "./logic/rowHandler";
import { Header } from "./Header";
import { List } from "./List";
import { Footer } from "./Footer";
import "./sheet.css";

interface SheetProps {
  stockGroup: IStockGrouped;
  totalQty: number;
}

export const Sheet = ({ stockGroup, totalQty }: SheetProps) => {
  return (
    <div className="font-mono text-sm">
      <div className="sheet-page w-[210mm] h-[297mm] my-[10mm] mx-auto py-8 px-12 border border-black bg-white">
        <Header
          stock_details={stockGroup.stock_picking_details}
          totalQty={totalQty}
        />
        <List
          stock_details={stockGroup.stock_picking_details}
          stock_lines={stockGroup.stock_move_lines}
        />
        <Footer stock_details={stockGroup.stock_picking_details} />
      </div>
    </div>
  );
};
