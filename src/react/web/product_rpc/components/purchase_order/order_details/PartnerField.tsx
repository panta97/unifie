import React from 'react';
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectPartnerCatalog } from "../../../app/slice/order/catalogSlice";
import { selectFormOrderState } from "../../../app/slice/order/formSlice";
import {
  selectPartnerId,
  selectPartnerName,
  updatePartner,
} from "../../../app/slice/order/orderDetailsSlice";
import { Partner } from "../../../types/catalogs";
import { ProductFormState } from "../../../types/product";
import { SelectCustom } from "../../shared/SelectCustom";

export const PartnerField = () => {
  const formState = useAppSelector(selectFormOrderState);
  const partnerId = useAppSelector(selectPartnerId);
  const partnerName = useAppSelector(selectPartnerName);
  const partners = useAppSelector(selectPartnerCatalog);
  const dispatch = useAppDispatch();

  const filteredPartners = (partner: Partner, inputVal: string) => {
    inputVal = inputVal.toUpperCase();
    if (
      partner.name.toUpperCase().includes(inputVal) ||
      partner.vat.toUpperCase().includes(inputVal)
    )
      return true;
    return false;
  };

  const handlePartner = (partner: Partner) => {
    if (formState === ProductFormState.CREATED) return;
    dispatch(
      updatePartner({ partnerId: partner.id, partnerName: partner.name })
    );
  };

  return (
    <div className="inline-flex flex-col mr-1">
      <label htmlFor="partner" className="text-xs">
        Proveedor
      </label>
      <SelectCustom
        currTag={{ id: partnerId, name: partnerName, vat: "" }}
        tagData={partners}
        updateTag={handlePartner}
        filterTags={filteredPartners}
        className="w-80"
      />
    </div>
  );
};
