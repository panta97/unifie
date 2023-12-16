import Counter from "../../currency/Counter";
import "./StoreLine.scss";

function StoreLine({ bgColor, storeName, salesAmount }) {
  return (
    <div className={`store-line ${bgColor}`}>
      <p className="store-line-name">{storeName}</p>
      {/* <p className="store-line-amount">{salesAmount}</p> */}
      <Counter pad={false} value={salesAmount} />
    </div>
  );
}

export default StoreLine;
