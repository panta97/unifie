import today from "../utils/date";

async function getSales(urlParams, date = today()) {
  const ENDPOINT = `/api/miscellaneous/sales/${date}`;
  try {
    const result = await fetch(ENDPOINT);
    const response = await result.json();
    return result.status === 200 ? response.body : [];
  } catch (error) {
    console.log(error);
    alert(error);
  }
}

export default getSales;
