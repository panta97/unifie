import React from 'react';
import { OrderItem } from "../../../../types/purchaseOrder";
import { ItemTableType } from "./OrderItemAttr";
import { TableAttr as TA } from "../../../shared/table/TableAttr";
import { OrderItemInput } from "./OrderItemInput";

interface NoAttrProps {
  title: string;
  type: ItemTableType;
  order_item: OrderItem;
  handleProduct: (e: any, productId: number) => void;
}

export const NoAttr = ({
  title,
  type,
  order_item,
  handleProduct,
}: NoAttrProps) => {
  return (
    <TA.Table>
      <thead>
        <TA.Tr>
          <TA.Th>{title}</TA.Th>
          <TA.Th>
            <div className="inline-flex">
              <OrderItemInput
                value={
                  type === ItemTableType.QTY
                    ? order_item.product_matrix[0].product_items[0].qty
                    : order_item.product_matrix[0].product_items[0].price
                }
                onChange={(e) =>
                  handleProduct(
                    e,
                    order_item.product_matrix[0].product_items[0].id
                  )
                }
                onFocus={(e) => e.target.select()}
              />
            </div>
          </TA.Th>
        </TA.Tr>
      </thead>
    </TA.Table>
  );
};
