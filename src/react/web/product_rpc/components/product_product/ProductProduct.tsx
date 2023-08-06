import React, { useCallback, useEffect } from "react";
import { ProductFormState } from "../../types/product";
import { Loader } from "../shared/Loader";
import { PPOptions } from "./PPOptions";
import { PPList } from "./list/PPList";
import { PPForm } from "./form/PPForm";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectCatalogs,
  updateMost,
  updateWeight,
} from "../../app/slice/product/catalogSlice";
import { selectFormState } from "../../app/slice/product/formSlice";
import { getCatalogs, getWeights } from "./shared";

const ProductProduct = () => {
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
    const resultMost = await getCatalogs();
    dispatch(updateMost({ catalogs: resultMost }));
    // TODO: need to validate if weightList was previously empty
    const resultWeight = await getWeights();
    dispatch(updateWeight({ weightCatalog: resultWeight }));
  }, [dispatch, catalogs]);

  useEffect(() => {
    downloadCatalogs();
  }, []);

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

export default ProductProduct;
