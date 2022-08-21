import "./Reload.scss";

function Reload({getDataFromAPI, isSyncing, lastUpdate}) {
  return (
    <div className="sync-section">
      <span
        onClick={_ => getDataFromAPI()}
        className={`sync-icon ${isSyncing ? 'rotating' : ''}`}/>
      <p className="sync-details">{`last update at ${lastUpdate}`}</p>
    </div>
  );
}

export default Reload;
