import React from 'react';
import { IOrderGrouped } from "../../logic/rowHandler";
import { Catalog } from "../../types";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { List } from "../List/List";
import "./sheet.css";

interface SheetProps {
  orderGroup: IOrderGrouped;
  totalQty: number;
  store: Catalog;
  typist: Catalog;
}

export const Sheet = ({ orderGroup, totalQty, store, typist }: SheetProps) => {
  return (
    <div className="font-mono text-sm">
      <div className="sheet-page w-[210mm] h-[297mm] my-[10mm] mx-auto py-8 px-12 border border-black bg-white">
        <Header
          order_details={orderGroup.order_details}
          totalQty={totalQty}
          store={store}
          typist={typist}
        />
        <List
          order_details={orderGroup.order_details}
          order_lines={orderGroup.order_lines}
          typist={typist}
        />
        <Footer order_details={orderGroup.order_details} />
      </div>
    </div>
  );
};
