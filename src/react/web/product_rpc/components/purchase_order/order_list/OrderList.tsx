import React from 'react';
import { Wrapper } from "../../shared/Wrapper";
import { CreateButton } from "./CreateButton";
import { OrderSummary } from "./OrderSummary";
import { OrderTable } from "./OrderTable";

interface OrderListProps {
  editMode?: boolean;
  currentOrderId?: number | null;
  onUpdateSuccess?: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({ 
  editMode = false,
  currentOrderId = null,
  onUpdateSuccess 
}) => {
  return (
    <Wrapper>
      <OrderTable />
      <OrderSummary />
      <div className="flex justify-end pt-2">
        <CreateButton 
          editMode={editMode} 
          currentOrderId={currentOrderId}
          onUpdateSuccess={onUpdateSuccess}
        />
      </div>
    </Wrapper>
  );
};
