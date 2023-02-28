import React from 'react';
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectFormOrderState } from "../../../app/slice/order/formSlice";
import {
  selectPartnerRef,
  updatePartnerRef,
} from "../../../app/slice/order/orderDetailsSlice";
import { ProductFormState } from "../../../types/product";

export const PartnerRefField = () => {
  const formState = useAppSelector(selectFormOrderState);
  const partnerRef = useAppSelector(selectPartnerRef);
  const dispatch = useAppDispatch();

  const handlePartnerRef = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    dispatch(updatePartnerRef({ partnerRef: newValue }));
  };

  return (
    <div className="inline-flex flex-col mr-1">
      <label htmlFor="partner_ref" className="text-xs">
        Referencia de Proveedor
      </label>
      <input
        className="border rounded text px-1 mr-1 w-40 text-sm"
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={partnerRef}
        onChange={handlePartnerRef}
        id="partner_ref"
        readOnly={formState === ProductFormState.CREATED}
      />
    </div>
  );
};
