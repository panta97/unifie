import React from 'react';
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { selectCatalogs } from "../../../../app/slice/product/catalogSlice";
import {
  selectProductBrandId,
  selectProductFamilyId,
  updateBrand,
} from "../../../../app/slice/product/productSlice";
import { Select } from "../../../shared/Select";

export const CategoryBrandField = () => {
  const catalogs = useAppSelector(selectCatalogs);
  const familyId = useAppSelector(selectProductFamilyId);
  const brandId = useAppSelector(selectProductBrandId);
  const dispatch = useAppDispatch();

  const handleCategoryBrand = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    dispatch(
      updateBrand({
        categoryBrandId: newId,
        categoryBrands: catalogs.product_category_brand,
      })
    );
  };

  return (
    <div className="inline-flex flex-col w-40 mr-1">
      <label htmlFor="cat_brand" className="text-xs">
        Marca
      </label>
      <Select
        id={brandId}
        handler={handleCategoryBrand}
        catalog={catalogs.product_category_brand.filter(
          (catBrand) => catBrand.parent_id === familyId
        )}
        name={"cat_brand"}
        autoFocus={false}
      />
    </div>
  );
};
