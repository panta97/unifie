import { StoreResponse } from "../types";

export const fetchStoreGoals = async (
  date: string
): Promise<StoreResponse | undefined> => {
  const ENDPOINT = `/api/miscellaneous/goals/tingo/${date}`;

  try {
    const response = await (await fetch(ENDPOINT)).json();
    return response.statusCode === 200 ? response.body : undefined;
  } catch (error) {
    alert(error);
  }
};
