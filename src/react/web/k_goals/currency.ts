export const currencyFormat = (amount: number) => {
  const Soles = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  });

  return Soles.format(amount);
};
