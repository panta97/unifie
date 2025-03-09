import React from 'react';
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { selectCatalogs } from "../../../../app/slice/product/catalogSlice";
import {
  selectProductLineId,
  updateLine,
} from "../../../../app/slice/product/productSlice";
import { Select } from "../../../shared/Select";

export const CategoryLineField = () => {
  const catalogs = useAppSelector(selectCatalogs);
  const lineId = useAppSelector(selectProductLineId);
  const dispatch = useAppDispatch();

  const handleCategoryLine = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    dispatch(
      updateLine({
        categoryLineId: newId,
        categoryLines: catalogs.product_category_line,
      })
    );
  };

  return (
    <div className="inline-flex flex-col w-40 mr-1">
      <label htmlFor="cat_line" className="text-xs">
        Categoría Principal
      </label>
      <Select
        id={lineId}
        handler={handleCategoryLine}
        catalog={catalogs.product_category_line}
        name={"cat_line"}
        autoFocus={false}
      />
    </div>
  );
};
