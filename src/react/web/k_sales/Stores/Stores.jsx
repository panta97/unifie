import "./Stores.scss";
import StoreLine from "./StoreLine/StoreLine";

function Stores({ sales, view }) {
  const totalSales = sales.reduce((acc, curr) => (acc += curr["amount"]), 0);

  return (
    <div>
      {sales
        .slice()
        .sort((storeA, storeB) => storeB.amount - storeA.amount)
        .map(({ code, name, amount }) => (
          <StoreLine
            key={code}
            bgColor={code}
            storeName={name}
            salesAmount={amount}
            view={view}
            totalSales={totalSales}
          />
        ))}
      <StoreLine
        bgColor={"tt-store"}
        storeName={"total"}
        salesAmount={totalSales}
        view={view}
        totalSales={totalSales}
      />
    </div>
  );
}

export default Stores;
