import { useAppSelector } from "../../../app/hooks";
import { selectFormItemStatus } from "../../../app/slice/order/formSlice";
import { selectOrderItem } from "../../../app/slice/order/orderItemSlice";
import { FetchStatus } from "../../../types/fetch";
import { Loader } from "../../shared/Loader";
import { Svg } from "../../shared/Svg";
import { ItemTableType, OrderItemAttr } from "./attr/OrderItemAttr";

export const OrderItemTable = () => {
  const orderItem = useAppSelector(selectOrderItem);
  const orderItemStatus = useAppSelector(selectFormItemStatus);

  return (
    <div className="flex justify-center">
      <div
        className="relative inline-block px-5 py-2 border border-transparent rounded-md overflow-hidden"
        style={
          orderItemStatus === FetchStatus.LOADING
            ? { minWidth: "120px", minHeight: "70px" }
            : {}
        }
      >
        {orderItem.id !== 0 && (
          <div className="flex flex-col items-center text-sm">
            <p className="text-base font-semibold mb-2 flex items-center">
              <span>{orderItem.name}</span>
              <span>&nbsp;-&nbsp;</span>
              <a
                tabIndex={-1}
                className="inline-block"
                href={orderItem.odoo_link}
                target="_blank"
                rel="noreferrer"
              >
                <Svg.ExternalLink className="h-5 w-5" />
              </a>
            </p>
            <OrderItemAttr type={ItemTableType.QTY} />
            <OrderItemAttr type={ItemTableType.PRICE} />
          </div>
        )}
        <Loader fetchStatus={orderItemStatus} portal={false} />
      </div>
    </div>
  );
};
