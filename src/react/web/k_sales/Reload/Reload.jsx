import "./Reload.scss";

function Reload({ getDataFromAPI, isSyncing, lastUpdate, showLastUpdate }) {
  return (
    <div className="sync-section">
      <button
        type="button"
        aria-label="Actualizar ventas"
        onClick={() => getDataFromAPI()}
        className={`sync-icon ${isSyncing ? "rotating" : ""}`}
      />
      {showLastUpdate && (
        <p className="sync-details">{`last update at ${lastUpdate}`}</p>
      )}
    </div>
  );
}

export default Reload;
