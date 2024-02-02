import { StoreSectionResponse } from "../types";

export const fetchStoreGoals = async (
  date: string
): Promise<StoreSectionResponse | undefined> => {
  const ENDPOINT = `/api/miscellaneous/goals/${date}`;

  try {
    const response = await (await fetch(ENDPOINT)).json();
    return response.statusCode === 200 ? response.body : undefined;
  } catch (error) {
    alert(error);
  }
};
