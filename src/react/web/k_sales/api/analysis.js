const ENDPOINT = "/api/miscellaneous/sales-analysis";

async function getSalesAnalysis({ intent, date, period = "week", store, limit = 8 }) {
  const result = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent, date, period, store, limit }),
  });
  const response = await result.json();

  if (!result.ok) {
    throw new Error(response.message || "No se pudo completar el análisis.");
  }
  return response.body;
}

export default getSalesAnalysis;
