import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../../app/hooks";
import { selectFormItemStatus } from "../../../app/slice/order/formSlice";
import { FetchStatus } from "../../../types/fetch";
import { ProductProductForm } from "../../../types/product";
import { Wrapper } from "../../shared/Wrapper";
import { useFetchOrderItem } from "../shared";

export const OrderProductList = () => {
  const [products, setProducts] = useState<ProductProductForm[]>([]);
  const itemStatus = useAppSelector(selectFormItemStatus);
  const { getOrderItem } = useFetchOrderItem();

  const handleGetOrderItem = async (productId: number) => {
    if (itemStatus === FetchStatus.IDLE) {
      await getOrderItem(productId, "product_template");
      setProducts((prev) => {
        return prev.filter((p) => p.odoo_id !== productId);
      });
    } else {
      window.alert("Cannot fetch product item while loading");
    }
  };

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (!urlParams.has("productsKey")) return;
    const productsKey = urlParams.get("productsKey")!;
    const productsString = localStorage.getItem(productsKey);
    if (!productsString) return;
    const products = JSON.parse(productsString) as ProductProductForm[];
    localStorage.removeItem(productsKey);
    setProducts(products);
  }, []);
  return (
    <>
      {products.length > 0 && (
        <Wrapper>
          <div className="text-xs overflow-x-scroll border border-gray-200 rounded-md">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-100">
                  <th className="font-normal p-1">Nombre</th>
                  <th className="font-normal p-1">Categoría</th>
                  <th className="font-normal p-1">Categoría POS</th>
                  <th className="font-normal p-1">Precio</th>
                  <th className="font-normal p-1">Atributos</th>
                  <th className="font-normal p-1">Referencia Interna</th>
                  <th className="font-normal p-1 text-center" colSpan={3}>
                    -
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="even:bg-gray-100">
                    <td className="p-1">{product.name}</td>
                    <td className="p-1">
                      {[
                        product.category_line_name,
                        product.category_family_name,
                        product.category_brand_name,
                        product.category_last_name
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </td>
                    <td className="p-1">{product.pos_categ_name}</td>
                    <td className="p-1">
                      {product.attr_list_price.length > 0 ? (
                        product.attr_list_price.map((attr, idx) => (
                          <span
                            className="rounded px-1 mr-0.5 mt-0.5 bg-gray-200 inline-block whitespace-pre-wrap"
                            style={{ fontSize: "10px" }}
                            key={idx}
                          >
                            {`${attr.attr_val_ids.reduce(
                              (acc, curr) => (acc += curr.name),
                              ""
                            )} : ${attr.list_price.toFixed(2)}`}
                          </span>
                        ))
                      ) : (
                        <span>{product.list_price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="p-1">
                      <div className="flex items-start flex-wrap">
                        {product.attrs.map((attr) => {
                          return attr.attr_vals.map((attrVal) => (
                            <span
                              className="rounded px-1 mr-0.5 mt-0.5 bg-gray-200 inline-block whitespace-pre-wrap"
                              style={{ fontSize: "10px" }}
                              key={attrVal.id}
                            >
                              {attrVal.name}
                            </span>
                          ));
                        })}
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="flex items-start flex-wrap">
                        {product.attr_default_code.length > 0 ? (
                          product.attr_default_code.map((attr, idx) => (
                            <span
                              className="rounded px-1 mr-0.5 mt-0.5 bg-gray-200 inline-block whitespace-pre-wrap"
                              style={{ fontSize: "10px" }}
                              key={idx}
                            >
                              {`${attr.attr_val_ids.reduce(
                                (acc, curr) => (acc += curr.name),
                                ""
                              )} : ${attr.default_code}`}
                            </span>
                          ))
                        ) : (
                          <span>{product.default_code}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-1" colSpan={3}>
                      <div className="flex justify-center">
                        <button
                          className="inline-flex items-center border border-gray-200 bg-gray-100 rounded px-2 py-0.5 bg-transparent cursor-pointer"
                          onClick={() => handleGetOrderItem(product.odoo_id!)}
                        >
                          Traer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Wrapper>
      )}
    </>
  );
};
