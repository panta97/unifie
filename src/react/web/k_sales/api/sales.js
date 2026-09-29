async function getSales(date) {
  const ENDPOINT = `/api/miscellaneous/sales/${date}`;
  const result = await fetch(ENDPOINT);
  const response = await result.json();

  if (!result.ok) {
    throw new Error(response.message || "No se pudieron cargar las ventas.");
  }
  if (!Array.isArray(response.body)) {
    return [];
  }

  // Django serializes Decimal values as strings; normalize them before rendering.
  return response.body.map((sale) => ({
    ...sale,
    amount: Number(sale.amount) || 0,
  }));
}

export default getSales;
