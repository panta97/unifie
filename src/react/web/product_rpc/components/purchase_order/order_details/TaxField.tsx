import React from 'react';
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectFormOrderState } from "../../../app/slice/order/formSlice";
import {
  selectIsTaxed,
  updateTax,
} from "../../../app/slice/order/orderDetailsSlice";
import { ProductFormState } from "../../../types/product";
import { Switch } from "../../shared/Switch";

export const TaxField = () => {
  const formState = useAppSelector(selectFormOrderState);
  const isTaxed = useAppSelector(selectIsTaxed);
  const dispatch = useAppDispatch();

  const handleTaxId = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formState === ProductFormState.CREATED) return;
    dispatch(updateTax({ isTaxed: e.target.checked }));
  };

  const handleTaxIdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (formState === ProductFormState.CREATED) return;
    if (e.key === "Enter") dispatch(updateTax({ isTaxed: !isTaxed }));
  };

  return (
    <div className="inline-flex flex-col mr-1 text-xs">
      <label htmlFor="company">Impuestos</label>
      <div
        className="flex items-center justify-between"
        style={{ height: "22px" }}
      >
        <div className="flex items-center mr-2">
          <Switch
            id="order_taxed"
            checked={isTaxed}
            onChange={(e) => handleTaxId(e)}
            onKeyDown={(e) => handleTaxIdKeyDown(e)}
          />
          <label>18% COMPRA INCLUIDO</label>
        </div>
      </div>
    </div>
  );
};
