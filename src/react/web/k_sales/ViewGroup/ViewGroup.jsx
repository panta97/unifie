import "./ViewGroup.scss";

function ViewGroup({updateView, view}) {
  return (
    <div className="view-group">
      <p className="view-group-title">view</p>
      <div className="view-group-btns">
        <button type="button" className={`view-btn ${view === 'p' ? 'view-btn-active' : ''}`} onClick={() => updateView('p')}>%</button>
        <button type="button" className={`view-btn ${view === 'k' ? 'view-btn-active' : ''}`} onClick={() => updateView('k')}>k</button>
        <button type="button" className={`view-btn ${view === 'n' ? 'view-btn-active' : ''}`} onClick={() => updateView('n')}>n</button>
      </div>
    </div>
  );
}

export default ViewGroup;
