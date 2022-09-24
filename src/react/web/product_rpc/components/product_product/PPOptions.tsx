import { batch } from "react-redux";
import { useAppDispatch } from "../../app/hooks";
import { updateAll } from "../../app/slice/product/catalogSlice";
import { updateFormStatus } from "../../app/slice/product/formSlice";
import { CatalogType } from "../../types/catalogs";
import { fetchResult, FetchStatus } from "../../types/fetch";
import { Wrapper } from "../shared/Wrapper";
import { getCatalogs } from "./shared";

export const PPOptions = () => {
  const dispatch = useAppDispatch();

  const handleUpdateCatalogs = async () => {
    try {
      dispatch(updateFormStatus({ status: FetchStatus.LOADING }));
      const params = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      };
      const response = await fetch(
        `/api/product-rpc/update/cats/${CatalogType.product}`,
        params
      );
      const json = await response.json();
      if (json.result === fetchResult.SUCCESS) {
        const result = await getCatalogs();
        batch(() => {
          dispatch(updateAll({ catalogs: result }));
          dispatch(updateFormStatus({ status: FetchStatus.IDLE }));
        });
        alert(json?.message);
      } else {
        dispatch(updateFormStatus({ status: FetchStatus.IDLE }));
        alert(json?.message);
      }
    } catch (error) {
      dispatch(updateFormStatus({ status: FetchStatus.IDLE }));
      alert(error);
    }
  };

  return (
    <Wrapper>
      <div className="flex justify-end">
        <button
          onClick={handleUpdateCatalogs}
          className="rounded bg-gray-100 px-2 py-1 cursor-pointer"
        >
          Actualizar Cats
        </button>
      </div>
    </Wrapper>
  );
};
