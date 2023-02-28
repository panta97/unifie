import React, { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectPartnerCatalog,
  updateOrderAll,
} from "../../app/slice/order/catalogSlice";
import {
  selectFormOrderState,
  selectFormOrderStatus,
} from "../../app/slice/order/formSlice";
import { ProductFormState } from "../../types/product";
import { Loader } from "../shared/Loader";
import { OrderDetails } from "./order_details/OrderDetails";
import { OrderItem } from "./order_item/OrderItem";
import { OrderList } from "./order_list/OrderList";
import { OrderProductList } from "./order_product_list/OrderProductList";
import { getCatalogs } from "./shared";

const PurchaseOrder = () => {
  const formState = useAppSelector(selectFormOrderState);
  const formStatus = useAppSelector(selectFormOrderStatus);
  const catalog = useAppSelector(selectPartnerCatalog);
  const dispatch = useAppDispatch();

  const downloadCatalogs = useCallback(async () => {
    const isCatalogEmpty = catalog.length === 0;
    if (!isCatalogEmpty) return;
    const result = await getCatalogs();
    dispatch(updateOrderAll({ catalogs: result }));
  }, [dispatch, catalog]);

  useEffect(() => {
    downloadCatalogs();
  }, []);

  return (
    <div>
      <OrderDetails />
      {formState === ProductFormState.DRAF && (
        <>
          <OrderProductList />
          <OrderItem />
        </>
      )}
      <OrderList />
      <Loader fetchStatus={formStatus} portal={true} />
    </div>
  );
};

export default PurchaseOrder;
