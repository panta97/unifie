import Counter from "../../currency/Counter";
import "./StoreLine.scss";

function StoreLine({ bgColor, storeName, salesAmount, view, totalSales }) {
  const displayAmount = view === "p"
    ? `${totalSales ? ((salesAmount / totalSales) * 100).toFixed(1) : "0.0"}%`
    : view === "k"
      ? `${(salesAmount / 1000).toFixed(1)}k`
      : null;

  return (
    <div className={`store-line ${bgColor}`}>
      <p className="store-line-name">{storeName}</p>
      {displayAmount ? (
        <p className="store-line-amount">{displayAmount}</p>
      ) : (
        <Counter pad={false} value={salesAmount.toFixed(2)} />
      )}
    </div>
  );
}

export default StoreLine;
