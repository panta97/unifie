import { useCallback, useEffect } from "react";
import { ProductFormState } from "../../types/product";
import { Loader } from "../shared/Loader";
import { PPOptions } from "./PPOptions";
import { PPList } from "./list/PPList";
import { PPForm } from "./form/PPForm";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectCatalogs,
  updateAll,
} from "../../app/slice/product/catalogSlice";
import { selectFormState } from "../../app/slice/product/formSlice";
import { getCatalogs } from "./shared";

export const ProductProduct = () => {
  const formState = useAppSelector(selectFormState);
  const catalogs = useAppSelector(selectCatalogs);
  const dispatch = useAppDispatch();

  const downloadCatalogs = useCallback(async () => {
    const areCatalogsEmpty =
      Object.values(catalogs).reduce(
        (prev, curr) => (prev += curr.length),
        0
      ) === 0;
    if (!areCatalogsEmpty) return;
    const result = await getCatalogs();
    dispatch(updateAll({ catalogs: result }));
  }, [dispatch, catalogs]);

  useEffect(() => {
    downloadCatalogs();
  }, [downloadCatalogs]);

  return (
    <div>
      {formState.formState === ProductFormState.DRAF && (
        <>
          <PPOptions />
          <PPForm />
        </>
      )}
      <PPList />
      <Loader fetchStatus={formState.status} portal={true} />
    </div>
  );
};
