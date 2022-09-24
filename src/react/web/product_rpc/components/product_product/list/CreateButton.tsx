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
} from "../../../app/slice/product/productListSlice";
import { reset as productReset } from "../../../app/slice/product/productSlice";
import { fetchResult, FetchStatus } from "../../../types/fetch";
import { ProductFormState, ProductResult } from "../../../types/product";
import { productsSchema } from "../PPValidation";

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
      const params = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
        body: JSON.stringify(products),
      };
      const response = await fetch("api/product_product", params);
      const json = await response.json();
      if (json.result === fetchResult.SUCCESS) {
        const productResults: ProductResult[] = json.products;
        batch(() => {
          dispatch(setOdooLink({ productResults }));
          dispatch(updateFormState({ formState: ProductFormState.CREATED }));
          dispatch(updateFormStatus({ status: FetchStatus.IDLE }));
        });
      } else {
        dispatch(updateFormStatus({ status: FetchStatus.IDLE }));
        alert(json.message);
      }
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
      <button
        onClick={(e) => {
          handleCreatePurchaseOrder();
          e.currentTarget.blur();
        }}
        className="rounded text-white bg-blue-400 px-2 py-1 cursor-pointer"
      >
        Crear Orden
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
