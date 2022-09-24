import { Catalogs, CatalogType } from "../../types/catalogs";

export const getCatalogs = async () => {
  const response = await fetch(`/api/product-rpc/catalogs/${CatalogType.product}`, {
    // headers: {
    //   Authorization: `Bearer ${window.localStorage.getItem("token")}`,
    // },
  });
  const result: Catalogs = await response.json();
  return result;
};
