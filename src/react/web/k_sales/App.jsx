import { useEffect, useState } from 'react';
import getSales from "./api/sales";
import './App.scss';
import Line from "./Line/Line";
import Reload from "./Reload/Reload";
import Stores from "./Stores/Stores";
import now from "./utils/now";
import ViewGroup from "./ViewGroup/ViewGroup";


function App() {

  const [sales, setSales] = useState([]);
  const viewTypeLS = localStorage.getItem('viewType');
  const [view, setView] = useState(viewTypeLS ? viewTypeLS : 'n');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  const updateView = (viewType) => {
    localStorage.setItem('viewType', viewType);
    setView(viewType);
  }

  const updateSyncing = (val) => {
    setIsSyncing(val);
  }

  const getDataFromAPI = async () => {
    // GET SALES IF QUERY STRING IS SET IN URL
    const params = new URLSearchParams(window.location.search)
    if (params.has('api')) {
      updateSyncing(true);
      setSales(await getSales(params));
      updateSyncing(false);
    }
  }

  useEffect(() => {
    getDataFromAPI();
  }, []);

  useEffect(() => {
    if (!isSyncing && sales.length)
      setLastUpdate(now());
  }, [isSyncing])

  return (
    <div>
      <Reload
        getDataFromAPI={getDataFromAPI}
        isSyncing={isSyncing}
        lastUpdate={lastUpdate}
      />
      <h1 className="main-title">today's sales</h1>
      <ViewGroup
        view={view}
        updateView={updateView}/>
      <Stores
        sales={sales}
        view={view}/>
      <Line
        sales={sales}/>
      <div className="line-deco"></div>
    </div>
  );
}

export default App;
