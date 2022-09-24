import { batch } from "react-redux";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { updateOrderAll } from "../../../app/slice/order/catalogSlice";
import {
  selectFormOrderState,
  updateOrderFormStatus,
} from "../../../app/slice/order/formSlice";
import { CatalogType } from "../../../types/catalogs";
import { fetchResult, FetchStatus } from "../../../types/fetch";
import { ProductFormState } from "../../../types/product";
import { getCatalogs } from "../shared";

export const POOptions = () => {
  const formState = useAppSelector(selectFormOrderState);
  const dispatch = useAppDispatch();

  const handleUpdateCatalogs = async () => {
    try {
      dispatch(updateOrderFormStatus({ status: FetchStatus.LOADING }));
      const params = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
      };
      const response = await fetch(
        `/api/product-rpc/update/cats/${CatalogType.order}`,
        params
      );
      const json = await response.json();
      if (json.result === fetchResult.SUCCESS) {
        const result = await getCatalogs();
        batch(() => {
          dispatch(updateOrderAll({ catalogs: result }));
          dispatch(updateOrderFormStatus({ status: FetchStatus.IDLE }));
        });
        alert(json?.message);
      } else {
        dispatch(updateOrderFormStatus({ status: FetchStatus.IDLE }));
        alert(json?.message);
      }
    } catch (error) {
      dispatch(updateOrderFormStatus({ status: FetchStatus.IDLE }));
      alert(error);
    }
  };

  return (
    <>
      {formState === ProductFormState.DRAF && (
        <div className="flex items-end">
          <button
            tabIndex={-1}
            onClick={handleUpdateCatalogs}
            className="rounded bg-gray-100 px-2 py-1 cursor-pointer"
          >
            Actualizar Provs
          </button>
        </div>
      )}
    </>
  );
};
