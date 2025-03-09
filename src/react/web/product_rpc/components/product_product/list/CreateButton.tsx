import React from "react";
import { batch } from "react-redux";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectFormState,
  updateFormState,
  updateFormStatus,
} from "../../../app/slice/product/formSlice";
import {
  reset as productListReset,
  selectProducts,
  setOdooLink,
  updateProductListFetchStatus,
} from "../../../app/slice/product/productListSlice";
import { reset as productReset } from "../../../app/slice/product/productSlice";
import { fetchResult, FetchStatus } from "../../../types/fetch";
import { ProductFormState, ProductResult } from "../../../types/product";
import { productsSchema } from "../PPValidation";

const BUNDLE_SIZE = 5;

export const CreateButton = () => {
  const formState = useAppSelector(selectFormState);
  const products = useAppSelector(selectProducts);
  const dispatch = useAppDispatch();

  const handleUploadProducts = async () => {
    try {
      // VALIDATE PRODUCTS
      await productsSchema.validate(products);
      // UPLOAD PRODUCTS
      dispatch(updateFormStatus({ status: FetchStatus.LOADING }));

      // since server could timeout for long product lists, we'll send them by bundles
      for (let i = 0; i < Math.ceil(products.length / BUNDLE_SIZE); i++) {
        const productBundle = products.slice(
          i * BUNDLE_SIZE,
          (i + 1) * BUNDLE_SIZE
        );
        const productIds = productBundle.map((product) => product.id);

        const params = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productBundle),
        };

        dispatch(
          updateProductListFetchStatus({
            productIds,
            fetchStatus: FetchStatus.LOADING,
          })
        );
        const response = await fetch(
          "/api/product-rpc/product_product",
          params
        );
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error en la solicitud:", response.status, errorText);
          alert(`Error ${response.status}: ${errorText}`);
          return;
        }
        dispatch(
          updateProductListFetchStatus({
            productIds,
            fetchStatus: FetchStatus.IDLE,
          })
        );

        const json = await response.json();
        if (json.result === fetchResult.SUCCESS) {
          const productResults: ProductResult[] = json.products;
          dispatch(setOdooLink({ productResults }));
        } else {
          dispatch(updateFormStatus({ status: FetchStatus.IDLE }));
          dispatch(
            updateProductListFetchStatus({
              productIds,
              fetchStatus: FetchStatus.IDLE,
            })
          );
          alert(json.message);
        }
      }

      batch(() => {
        dispatch(updateFormState({ formState: ProductFormState.CREATED }));
        dispatch(updateFormStatus({ status: FetchStatus.IDLE }));
      });
    } catch (error) {
      dispatch(updateFormStatus({ status: FetchStatus.IDLE }));
      alert(error);
    }
  };

  const handleCreatePurchaseOrder = () => {
    const productsData = JSON.stringify(products);
    const productsKey = String(new Date().getTime());
    localStorage.setItem(productsKey, productsData);
    window.open(`purchase-order?productsKey=${productsKey}`, "_blank");
  };

  const handleResetForm = () => {
    batch(() => {
      dispatch(productReset());
      dispatch(productListReset());
      dispatch(updateFormState({ formState: ProductFormState.DRAF }));
    });
  };

  return formState.formState === ProductFormState.DRAF ? (
    <button
      onClick={(e) => {
        handleUploadProducts();
        e.currentTarget.blur();
      }}
      className="rounded bg-gray-100 px-2 py-1 cursor-pointer w-24"
    >
      Crear
    </button>
  ) : (
    <div className="space-x-1">
      {/* <button
        onClick={(e) => {
          handleCreatePurchaseOrder();
          e.currentTarget.blur();
        }}
        className="rounded text-white bg-blue-400 px-2 py-1 cursor-pointer"
      >
        Crear Orden
      </button> */}
      <button
        onClick={(e) => {
          handleCreatePurchaseOrder();
          e.currentTarget.blur();
        }}
        className="rounded text-white bg-blue-400 px-2 py-1 cursor-pointer"
      >
        Ir a Importar Orden
      </button>
      <button
        onClick={(e) => {
          handleResetForm();
          e.currentTarget.blur();
        }}
        className="rounded text-white bg-blue-400 px-2 py-1 cursor-pointer w-24"
      >
        Nuevo
      </button>
    </div>
  );
};
