import { IOrderGrouped, RowHandler } from "./logic/rowHandler";
import { Sheet } from "./Components/Sheet/Sheet";
import { Destiny } from "./Components/Destiny/Destiny";
import { useState } from "react";
import { Catalog } from "./types";
import { stores } from "./logic/stores";
import { useEffect } from "react";
import { getPurchaseOrder } from "./logic/endpoint";

const App = () => {
  const [store, setStore] = useState<Catalog>(stores[0]);
  const [orderGroups, setOrderGroups] = useState<IOrderGrouped[]>([]);
  const [totalQty, setTotalQty] = useState<number>(0);

  const fetchOrder = async () => {
    const params = new URLSearchParams(window.location.search);
    const order = await getPurchaseOrder(params);
    if (!order) return;
    document.title = order.order_details.name;
    const rowHandler = new RowHandler(order);
    setOrderGroups(rowHandler.getGroups());
    setTotalQty(rowHandler.getTotalQty);
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  const handleStoreUpdate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    const newStore = stores.find((store) => store.id === newId);
    if (!newStore) return;
    setStore(newStore);
  };

  return (
    <div>
      <Destiny store={store} updateStore={handleStoreUpdate} />
      {orderGroups.map((orderGroup, idx) => (
        <Sheet
          key={idx}
          orderGroup={orderGroup}
          totalQty={totalQty}
          store={store}
        />
      ))}
    </div>
  );
};

export default App;
