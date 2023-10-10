import React, { useState } from "react";
import { IStockGrouped, RowHandler } from "./logic/rowHandler";
import { useEffect } from "react";
import { getStock } from "./logic/endpoint";
import { Sheet } from "./Sheet";
import "./index.css";

const App = () => {
  const [stockGroups, setStockGroups] = useState<IStockGrouped[]>([]);
  const [totalQty, setTotalQty] = useState<number>(0);

  const fetchStock = async () => {
    const params = new URLSearchParams(window.location.search);
    const stock = await getStock(params);
    if (!stock) return;
    document.title = stock.stock_picking_details.name;
    const rowHandler = new RowHandler(stock);
    setStockGroups(rowHandler.getGroups());
    setTotalQty(rowHandler.getTotalQty);
  };

  useEffect(() => {
    fetchStock();
  }, []);

  return (
    <div>
      {stockGroups.map((stockGroup, idx) => (
        <Sheet key={idx} stockGroup={stockGroup} totalQty={totalQty} />
      ))}
    </div>
  );
};

export default App;
