import React from 'react';
import { Wrapper } from "../../shared/Wrapper";
import { CreateButton } from "./CreateButton";
import { OrderSummary } from "./OrderSummary";
import { OrderTable } from "./OrderTable";

export const OrderList = () => {
  return (
    <Wrapper>
      <OrderTable />
      <OrderSummary />
      <div className="flex justify-end pt-2">
        <CreateButton />
      </div>
    </Wrapper>
  );
};
