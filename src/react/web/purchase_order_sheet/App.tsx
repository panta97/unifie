import React, { useState } from "react";
import { useAppDispatch } from "../product_rpc/app/hooks";
import { updateCompany } from "../product_rpc/app/slice/order/orderDetailsSlice";
import { IOrderGrouped, RowHandler } from "./logic/rowHandler";
import { Sheet } from "./Components/Sheet/Sheet";
import { Destiny } from "./Components/Destiny/Destiny";
import { Catalog } from "./types";
import { stores, storesTypist } from "./logic/stores";
import { useEffect } from "react";
import { getPurchaseOrder } from "./logic/endpoint";
import { Typist } from "./Components/Typist/Typist";

const App = () => {
  const dispatch = useAppDispatch();
  const [store, setStore] = useState<Catalog>(stores[0]);
  const [storeTypist,] = useState<Catalog[]>(storesTypist);
  const [typist, setTypist] = useState<Catalog>(storesTypist[0]);
  const [orderGroups, setOrderGroups] = useState<IOrderGrouped[]>([]);
  const [totalQty, setTotalQty] = useState<number>(0);

  const fetchOrder = async () => {
    const params = new URLSearchParams(window.location.search);
    const order = await getPurchaseOrder(params);

    if (!order) return;

    if (!order.order_details) {
      console.error("order_details no está definido");
      return;
    }

    if (!order.order_lines || !Array.isArray(order.order_lines)) {
      console.error("order_lines no está definido o no es un array");
      return;
    }

    document.title = order.order_details.name;
    dispatch(updateCompany({ company_id: order.order_details.company_id }));

    const initialStore = stores.find(
      (s) => s.id === order.order_details.company_id
    );
    if (initialStore) setStore(initialStore);

    const rowHandler = new RowHandler(order);
    setOrderGroups(rowHandler.getGroups());
    setTotalQty(rowHandler.getTotalQty());
  };

  const handleStoreUpdate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    const newStore = stores.find((store) => store.id === newId);
    if (!newStore) return;
    setStore(newStore);
  };

  const handleStoreUpdateTypist = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const typist = storesTypist?.find((store) => store.id === Number(e.target.value))!;
    setTypist(typist);
  };

  useEffect(() => {
    fetchOrder();
    setTypist(storeTypist[0]);
  }, []);

  return (
    <div>
      <Destiny store={store} updateStore={handleStoreUpdate} />
      <Typist store={storeTypist} updateStore={handleStoreUpdateTypist} />
      {orderGroups.map((orderGroup, idx) => (
        <Sheet
          key={idx}
          orderGroup={orderGroup}
          totalQty={totalQty}
          store={store}
          typist={typist}
        />
      ))}
    </div>
  );
};

export default App;
