import React from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { selectCatalogs } from "../../../../app/slice/product/catalogSlice";
import {
  selectProductFamilyId,
  selectProductLineId,
  updateFamily,
  updateWeight,
} from "../../../../app/slice/product/productSlice";
import { Select } from "../../../shared/Select";

export const CategoryFamilyField = () => {
  const catalogs = useAppSelector(selectCatalogs);
  const lineId = useAppSelector(selectProductLineId);
  const familyId = useAppSelector(selectProductFamilyId);
  const weightList = useAppSelector(
    (state) => state.product.catalog.weight_list
  );
  const dispatch = useAppDispatch();

  const handleCategoryFamily = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    dispatch(
      updateFamily({
        categoryFamilyId: newId,
        categoryFamilies: catalogs.product_category_family,
      })
    );
    // side effect: udpate weight
    const weightItem = weightList.find((w) => w.product_category_id === newId);
    if (weightItem) {
      dispatch(updateWeight({ weight: weightItem.weight }));
    }
  };

  return (
    <div className="inline-flex flex-col w-40 mr-1">
      <label htmlFor="cat_family" className="text-xs">
        Familia
      </label>
      <Select
        id={familyId}
        handler={handleCategoryFamily}
        catalog={catalogs.product_category_family.filter(
          (catFamily) => catFamily.parent_id === lineId
        )}
        name={"cat_family"}
        autoFocus={false}
      />
    </div>
  );
};
