import React from 'react';
import { Wrapper } from "../../shared/Wrapper";
import { OrderName } from "./OrderName";
import { PartnerField } from "./PartnerField";
import { PartnerRefField } from "./PartnerRefField";
import { POOptions } from "./POOptions";
import { TaxField } from "./TaxField";
import { SelectWarehouse } from "./SelectWarehouse";

export const OrderDetails = () => {
  return (
    <Wrapper>
      <div>
        <OrderName />
      </div>
      <div className="flex justify-between">
        <div>
          <PartnerField />
          <PartnerRefField />
          <TaxField />
          <SelectWarehouse />
        </div>
        <POOptions />
      </div>
    </Wrapper>
  );
};
