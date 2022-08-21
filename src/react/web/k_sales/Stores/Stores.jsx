import "./Stores.scss";
import StoreLine from "./StoreLine/StoreLine";

function Stores({ sales, view }) {
  const totalSales = sales.reduce((acc, curr) => (acc += curr["amount"]), 0);
  let salesFormatted;
  switch (view) {
    case "p":
      salesFormatted = (storeSales) => {
        return `${((storeSales / totalSales) * 100).toFixed(2)} %`;
      };
      break;
    case "k":
      salesFormatted = (storeSales) => {
        return `${(storeSales / 1000).toFixed(1)}K`;
      };
      break;
    case "n":
      salesFormatted = (storeSales) => {
        return `S/ ${storeSales.toFixed(2)}`;
      };
      break;
  }

  return (
    <div>
      {sales
        .sort((storeA, storeB) => storeB.amount - storeA.amount)
        .map(({ code, name, amount }) => (
          <StoreLine
            key={code}
            bgColor={code}
            storeName={name}
            salesAmount={salesFormatted(amount)}
            view={view}
          />
        ))}
      <StoreLine
        bgColor={"tt-store"}
        storeName={"total"}
        salesAmount={salesFormatted(totalSales)}
        view={view}
      />
    </div>
  );
}

export default Stores;
