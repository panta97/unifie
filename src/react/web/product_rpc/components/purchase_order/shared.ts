import { useAppDispatch } from "../../app/hooks";
import { updateItemStatus } from "../../app/slice/order/formSlice";
import { replaceItem } from "../../app/slice/order/orderItemSlice";
import { CatalogType, OrderCatalogs } from "../../types/catalogs";
import { fetchResult, FetchStatus } from "../../types/fetch";

export const useFetchOrderItem = () => {
  const dispatch = useAppDispatch();

  const getOrderItem = async (
    productId: number,
    type: "product_product" | "product_template"
  ) => {
    try {
      dispatch(updateItemStatus({ itemStatus: FetchStatus.LOADING }));
      const response = await fetch(
        `/api/product-rpc/purchase_order/order_item?productId=${productId}&type=${type}`
      );
      const json = await response.json();
      if (json.result === fetchResult.SUCCESS)
        dispatch(replaceItem({ orderItem: json.order_item }));
      else alert(json.message);
    } catch (error) {
      alert(error);
    } finally {
      dispatch(updateItemStatus({ itemStatus: FetchStatus.IDLE }));
    }
  };

  return { getOrderItem };
};

export const getCatalogs = async () => {
  const response = await fetch(`/api/product-rpc/catalogs/${CatalogType.order}`, {
    // headers: {
    //   Authorization: `Bearer ${window.localStorage.getItem("token")}`,
    // },
  });
  const result: OrderCatalogs = await response.json();
  return result;
};
