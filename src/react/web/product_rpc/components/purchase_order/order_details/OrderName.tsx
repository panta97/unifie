import React from 'react';
import { useAppSelector } from "../../../app/hooks";
import { selectFormOrderState } from "../../../app/slice/order/formSlice";
import { selectOrderDetails } from "../../../app/slice/order/orderDetailsSlice";
import { ProductFormState } from "../../../types/product";
import { Svg } from "../../shared/Svg";

export const OrderName = () => {
  const formState = useAppSelector(selectFormOrderState);
  const orderDetails = useAppSelector(selectOrderDetails);

  return (
    <>
      {formState === ProductFormState.CREATED && (
        <div className="text-base font-semibold">
          <a
            className="inline-flex items-center"
            title="Odoo link"
            target="_blank"
            rel="noopener noreferrer"
            href={orderDetails.odoo_link}
          >
            <span>{`PO${String(orderDetails.odoo_id!).padStart(5, "0")}`}</span>
            <Svg.ExternalLink className="h-5 w-5 inline-block" />
          </a>
        </div>
      )}
    </>
  );
};
