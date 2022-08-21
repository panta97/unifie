async function getPurchaseOrder(urlParams) {
  const model = urlParams.get("model");
  const id = urlParams.get("id");
  const ENDPOINT = `${urlParams.get("api")}?model=${model}&id=${id}`;
  const PARAMS = {
    headers: {
      "x-api-key": urlParams.get("key"),
    },
  };
  try {
    const response = await (await fetch(ENDPOINT, PARAMS)).json();
    return response.statusCode === 200 ? response.body : [];
  } catch (error) {
    console.log(error);
  }
}

export default getPurchaseOrder;
