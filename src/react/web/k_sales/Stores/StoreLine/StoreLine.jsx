import './StoreLine.scss';

function StoreLine({bgColor, storeName, salesAmount}) {
    return (
      <div className={`store-line ${bgColor}`}>
          <p className="store-line-name">{storeName}</p>
          <p className="store-line-amount">{salesAmount}</p>
      </div>
    );
  }

export default StoreLine;
