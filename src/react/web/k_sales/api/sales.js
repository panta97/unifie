import today from '../utils/date';

async function getSales(urlParams, date=today()) {
  const ENDPOINT = `${urlParams.get('api')}?date=${date}`;
  const PARAMS = {
    headers: {
      'x-api-key': urlParams.get('key'),
    },
  }
  try {
    const response = await (await fetch(ENDPOINT, PARAMS)).json();
    return response.statusCode === 200 ? response.body : [];
  } catch (error) {
    console.log(error);
  }
}

export default getSales;
