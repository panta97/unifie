import React from 'react';
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
  selectProductActivoEcommerce,
  updateActivoEcommerce,
} from "../../../../app/slice/product/productSlice";

export const ActivoEcommerceField = () => {
  const activoEcommerce = useAppSelector(selectProductActivoEcommerce);
  const dispatch = useAppDispatch();

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateActivoEcommerce({ activoEcommerce: e.target.checked }));
  };

  return (
    <div className="inline-flex flex-col w-36 mr-1">
      <label htmlFor="x_studio_activo_ecommerce" className="text-xs mb-1">
        Ecommerce
      </label>
      <label
        htmlFor="x_studio_activo_ecommerce"
        className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700 select-none mt-[-2px]"
      >
        <input
          className="rounded border border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
          type="checkbox"
          id="x_studio_activo_ecommerce"
          name="x_studio_activo_ecommerce"
          checked={activoEcommerce}
          onChange={handleCheckboxChange}
        />
        <span>Activo Ecommerce</span>
      </label>
    </div>
  );
};
