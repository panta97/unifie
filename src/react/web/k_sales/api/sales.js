async function getSales(date) {
  const ENDPOINT = `/api/miscellaneous/sales/${date}`;
  const result = await fetch(ENDPOINT);
  const response = await result.json();

  if (!result.ok) {
    throw new Error(response.message || "No se pudieron cargar las ventas.");
  }
  return Array.isArray(response.body) ? response.body : [];
}

export default getSales;
