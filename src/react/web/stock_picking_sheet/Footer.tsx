import React from "react";
import { IStockPickingDetailsGrouped } from "./logic/rowHandler";

interface FooterProps {
  stock_details: IStockPickingDetailsGrouped;
}

export const Footer = ({ stock_details }: FooterProps) => {
  return (
    <div>
      Página {stock_details.page} de {stock_details.totalPages}
    </div>
  );
};
