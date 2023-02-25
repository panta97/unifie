export const getCurrencyFormat = (price: number) => {
  // price can be either string or number
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(price);
};

export const getTomorrowDate = (): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${day} / ${month} / ${year}`;
};

export const fixNumber = (n: number) => {
  return Number(n.toFixed(2));
};
