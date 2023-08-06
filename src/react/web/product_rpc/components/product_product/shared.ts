import { Catalogs, CatalogType, WeightCatalog } from "../../types/catalogs";

export const getCatalogs = async () => {
  const response = await fetch(
    `/api/product-rpc/catalogs/${CatalogType.product}`
  );
  const result: Catalogs = await response.json();
  return result;
};

export const getWeights = async () => {
  const response = await fetch(
    `/api/product-rpc/catalogs/${CatalogType.weight}`
  );
  const result: WeightCatalog = await response.json();
  return result;
};
