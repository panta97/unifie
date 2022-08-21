import "./ViewGroup.scss";

function ViewGroup({updateView, view}) {
  return (
    <div className="view-group">
      <p className="view-group-title">view</p>
      <div className="view-group-btns">
        <div className={`view-btn ${view === 'p' ? 'view-btn-active' : ''}`} onClick={_ => updateView('p')}>%</div>
        <div className={`view-btn ${view === 'k' ? 'view-btn-active' : ''}`} onClick={_ => updateView('k')}>k</div>
        <div className={`view-btn ${view === 'n' ? 'view-btn-active' : ''}`} onClick={_ => updateView('n')}>n</div>
      </div>
    </div>
  );
}

export default ViewGroup;
