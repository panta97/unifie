const ENDPOINT = "/api/miscellaneous/sales-analysis";

function getCsrfToken() {
  const cookie = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("csrftoken="));

  return cookie ? decodeURIComponent(cookie.slice("csrftoken=".length)) : "";
}

async function getSalesAnalysis({ intent, question, date, period = "week", store, limit = 8 }) {
  const result = await fetch(ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: JSON.stringify({ intent, question, date, period, store, limit }),
  });
  const response = await result.json();

  if (!result.ok) {
    throw new Error(response.message || "No se pudo completar el análisis.");
  }
  return response.body;
}

export default getSalesAnalysis;
