import React from 'react';
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
  deleteAttrCol,
  deleteAttrRow,
  selectOrderItem,
  updateProductPrice,
  updateProductQty,
} from "../../../../app/slice/order/orderItemSlice";
import { NoAttr } from "./NoAttr";
import { OneAttr } from "./OneAttr";
import { TwoAttr } from "./TwoAttr";

export enum ItemTableType {
  PRICE,
  QTY,
}

interface OrderItemAttrProps {
  type: ItemTableType;
}

export const OrderItemAttr = ({ type }: OrderItemAttrProps) => {
  const orderItem = useAppSelector(selectOrderItem);
  const dispatch = useAppDispatch();
  let handleProduct: (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: number
  ) => void;
  let title: string;

  switch (type) {
    case ItemTableType.QTY:
      title = "Cantidad";
      handleProduct = (e, productId) => {
        const newVal = isNaN(e.target.valueAsNumber)
          ? 0
          : e.target.valueAsNumber;
        dispatch(updateProductQty({ productId, qty: newVal }));
      };
      break;
    case ItemTableType.PRICE:
      title = "Precio U.";
      handleProduct = (e, productId) => {
        const newVal = isNaN(e.target.valueAsNumber)
          ? 0
          : e.target.valueAsNumber;
        dispatch(updateProductPrice({ productId, price: newVal }));
      };
      break;
  }

  const handleDeleteRow = (attrRowId: number) => {
    dispatch(deleteAttrRow({ attrRowId }));
  };
  const handleDeleteCol = (attrColId: number) => {
    dispatch(deleteAttrCol({ attrColId }));
  };

  if (orderItem.attr_cols && orderItem.attr_rows) {
    return (
      <TwoAttr
        title={title}
        type={type}
        order_item={orderItem}
        handleDeleteRow={handleDeleteRow}
        handleDeleteCol={handleDeleteCol}
        handleProduct={handleProduct}
      />
    );
  } else if (orderItem.attr_cols) {
    return (
      <OneAttr
        title={title}
        type={type}
        order_item={orderItem}
        handleDeleteCol={handleDeleteCol}
        handleProduct={handleProduct}
      />
    );
  } else {
    return (
      <NoAttr
        title={title}
        type={type}
        order_item={orderItem}
        handleProduct={handleProduct}
      />
    );
  }
};
