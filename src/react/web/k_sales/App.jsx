import { useEffect, useState } from "react";
import getSales from "./api/sales";
import getSalesAnalysis from "./api/analysis";
import "./App.scss";
import Line from "./Line/Line";
import Reload from "./Reload/Reload";
import Stores from "./Stores/Stores";
import now from "./utils/now";
import ViewGroup from "./ViewGroup/ViewGroup";
import today from "./utils/date";
import { DateTime } from "luxon";

const todayDate = today();

function App() {
  const [sales, setSales] = useState([]);
  const [salesError, setSalesError] = useState("");
  const viewTypeLS = localStorage.getItem("viewType");
  const [view, setView] = useState(viewTypeLS ? viewTypeLS : "n");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [iptDate, setIptDate] = useState(todayDate);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysisActions = [
    { intent: "top_products", label: "Productos más vendidos", detail: "esta semana" },
    { intent: "products_up", label: "Productos que más subieron", detail: "esta semana" },
    { intent: "products_down", label: "Productos que más bajaron", detail: "esta semana" },
    { intent: "sales_drivers", label: "Qué explica el cambio", detail: "esta semana" },
    { intent: "store_comparison", label: "Comparar tiendas", detail: "esta semana" },
    { intent: "top_products", store: "abtao", label: "Top variantes de Abtao", detail: "esta semana" },
    { intent: "top_products", store: "tingo maria", label: "Top variantes de Tingo María", detail: "esta semana" },
  ];

  const updateView = (viewType) => {
    localStorage.setItem("viewType", viewType);
    setView(viewType);
  };

  const updateSyncing = (val) => {
    setIsSyncing(val);
  };

  const getDataFromAPI = async (date) => {
    updateSyncing(true);
    setSalesError("");
    try {
      const sales = await getSales(date);
      setSales(sales);
      setLastUpdate(now());
    } catch (error) {
      setSales([]);
      setSalesError(error.message);
    } finally {
      updateSyncing(false);
    }
  };

  const handleDate = (e) => {
    setIptDate(e.target.value);
    getDataFromAPI(e.target.value);
  };

  useEffect(() => {
    getDataFromAPI(iptDate);
  }, []);

  const runAnalysis = async (action) => {
    setIsAnalyzing(true);
    setAnalysisError("");
    try {
      const result = await getSalesAnalysis({
        ...action,
        date: iptDate,
        period: "week",
      });
      setAnalysis(result);
    } catch (error) {
      setAnalysis(null);
      setAnalysisError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="sales-page">
      <Reload
        getDataFromAPI={() => getDataFromAPI(iptDate)}
        isSyncing={isSyncing}
        lastUpdate={lastUpdate}
        showLastUpdate={todayDate === iptDate}
      />
      <main>
      <h1 className="main-title">
        ventas{", "}
        {DateTime.fromFormat(iptDate, "yyyy-MM-dd")
          .setLocale("es")
          .toFormat("cccc dd 'de' LLLL")}
      </h1>
      <div className="date-control">
      <label htmlFor="sales-date">Fecha del reporte</label>
      <input
        id="sales-date"
        type={"date"}
        value={iptDate}
        onChange={handleDate}
      />
      </div>
      {salesError && <p className="status-message status-error">{salesError}</p>}
      <ViewGroup view={view} updateView={updateView} />
      <Stores sales={sales} view={view} />
      <Line sales={sales} />
      <section className="analysis-panel" aria-labelledby="analysis-title">
        <div className="analysis-heading">
          <div>
            <p className="analysis-kicker">Lectura rápida</p>
            <h2 id="analysis-title">Análisis de ventas</h2>
            <p>Elige una pregunta y revisa las cifras que la explican.</p>
          </div>
          <span className="analysis-date">Semana hasta {iptDate}</span>
        </div>
        <div className="analysis-actions">
          {analysisActions.map((action) => (
            <button
              type="button"
              className={`analysis-action ${analysis?.intent === action.intent && analysis?.store === action.store ? "is-selected" : ""}`}
              key={`${action.intent}-${action.store || "all"}`}
              onClick={() => runAnalysis(action)}
              disabled={isAnalyzing}
            >
              <span>{action.label}</span>
              <small>{action.detail}</small>
            </button>
          ))}
        </div>
        {isAnalyzing && <p className="status-message">Consultando las ventas…</p>}
        {analysisError && <p className="status-message status-error">{analysisError}</p>}
        {analysis && !isAnalyzing && (
          <div className="analysis-result">
            <p className="analysis-answer">{analysis.answer}</p>
            <div className="analysis-period">
              <span>Actual: {analysis.period.current.start} al {analysis.period.current.end}</span>
              <span>Anterior: {analysis.period.previous.start} al {analysis.period.previous.end}</span>
            </div>
            <AnalysisTable rows={analysis.rows} intent={analysis.intent} />
          </div>
        )}
      </section>
      </main>
    </div>
  );
}

function AnalysisTable({ rows, intent }) {
  if (!rows.length) {
    return <p className="analysis-empty">No hay suficientes datos para comparar estos periodos.</p>;
  }

  const isStore = intent === "store_comparison";
  return (
    <div className="analysis-table-wrap">
      <table className="analysis-table">
        <thead>
          <tr>
            <th>{isStore ? "Tienda" : "Producto"}</th>
            <th>{isStore ? "Actual" : "Venta neta"}</th>
            <th>{isStore ? "Variación" : "Unidades"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.product_id || row.store}>
              <td>{row.product_name || row.store}</td>
              <td>S/ {row.amount || row.current}</td>
              <td>{isStore ? `${row.difference >= 0 ? "+" : ""}S/ ${row.difference}` : row.quantity_net}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
