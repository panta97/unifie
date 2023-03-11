import { useEffect, useState } from "react";
import getSales from "./api/sales";
import "./App.scss";
import Line from "./Line/Line";
import Reload from "./Reload/Reload";
import Stores from "./Stores/Stores";
import now from "./utils/now";
import ViewGroup from "./ViewGroup/ViewGroup";
import today from "./utils/date";

const todayDate = today();

function App() {
  const [sales, setSales] = useState([]);
  const viewTypeLS = localStorage.getItem("viewType");
  const [view, setView] = useState(viewTypeLS ? viewTypeLS : "n");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [iptDate, setIptDate] = useState(todayDate);

  const updateView = (viewType) => {
    localStorage.setItem("viewType", viewType);
    setView(viewType);
  };

  const updateSyncing = (val) => {
    setIsSyncing(val);
  };

  const getDataFromAPI = async (date) => {
    updateSyncing(true);
    const sales = await getSales(date);
    setSales(sales);
    updateSyncing(false);
  };

  const handleDate = (e) => {
    setIptDate(e.target.value);
    getDataFromAPI(e.target.value);
  };

  useEffect(() => {
    getDataFromAPI(iptDate);
  }, []);

  useEffect(() => {
    if (!isSyncing && sales.length) setLastUpdate(now());
  }, [isSyncing]);

  return (
    <div>
      <Reload
        getDataFromAPI={() => getDataFromAPI(iptDate)}
        isSyncing={isSyncing}
        lastUpdate={lastUpdate}
        showLastUpdate={todayDate === iptDate}
      />
      <h1 className="main-title" style={{ marginBottom: "5px" }}>
        today's sales
      </h1>
      <input
        style={{ marginLeft: "40px", marginBottom: "8px" }}
        type={"date"}
        value={iptDate}
        onChange={handleDate}
      />
      <ViewGroup view={view} updateView={updateView} />
      <Stores sales={sales} view={view} />
      <Line sales={sales} />
    </div>
  );
}

export default App;
