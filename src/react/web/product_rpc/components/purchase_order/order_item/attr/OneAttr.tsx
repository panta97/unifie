import { OrderItem, ProductItem } from "../../../../types/purchaseOrder";
import { ItemTableType } from "./OrderItemAttr";
import { TableAttr as TA } from "../../../shared/table/TableAttr";
import { useModal } from "../../../../hooks/useModal";
import { ProductAttributeSort } from "../../../product_attribute/ProductAttributeSort";
import { fillProductItemValue } from "../../../../app/slice/order/orderItemSlice";
import { useAppDispatch } from "../../../../app/hooks";
import { OrderItemInput } from "./OrderItemInput";

interface OneAttrProps {
  title: string;
  type: ItemTableType;
  order_item: OrderItem;
  handleDeleteCol: (attrColId: number) => void;
  handleProduct: (e: any, productId: number) => void;
}

export const OneAttr = ({
  title,
  type,
  order_item,
  handleDeleteCol,
  handleProduct,
}: OneAttrProps) => {
  const dispatch = useAppDispatch();
  const { isShowing, toggle } = useModal();

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    productItem: ProductItem,
    type: ItemTableType,
    posX: number,
    posY: number
  ) => {
    if (e.shiftKey && e.ctrlKey && e.key === "ArrowRight")
      dispatch(
        fillProductItemValue({ productItem, type, dir: "right", posX, posY })
      );
    else if (e.shiftKey && e.ctrlKey && e.key === "ArrowLeft")
      dispatch(
        fillProductItemValue({ productItem, type, dir: "left", posX, posY })
      );
  };

  return (
    <>
      <TA.Table>
        <thead>
          <TA.Tr>
            <TA.Th>{title}</TA.Th>
            <TA.Th colSpan={order_item.attr_cols!.attr_vals.length}>
              <span>{order_item.attr_cols!.attr.name}</span>
              &nbsp;-&nbsp;
              <span
                className="cursor-pointer text-blue-400 hover:underline"
                onClick={() => toggle()}
              >
                Editar
              </span>
            </TA.Th>
          </TA.Tr>
          <TA.Tr>
            <TA.Th />
            {order_item.attr_cols!.attr_vals.map((attrVal) => (
              <TA.Th key={attrVal.id}>
                <div className="flex justify-between">
                  <span>{attrVal.name}</span>
                  <span
                    title="Eliminar"
                    className="cursor-pointer"
                    onClick={() => handleDeleteCol(attrVal.id)}
                  >
                    &times;
                  </span>
                </div>
              </TA.Th>
            ))}
          </TA.Tr>
        </thead>
        <tbody>
          {order_item.product_matrix.map((productRow, idxRow) => {
            return (
              <TA.Tr key={productRow.id} className="last:border-b-0">
                <TA.Td />
                {productRow.product_items.map((productItem, idxCol) => {
                  return (
                    <TA.Td key={productItem.id}>
                      <div className="inline-flex">
                        <OrderItemInput
                          value={
                            type === ItemTableType.QTY
                              ? productItem.qty
                              : productItem.price
                          }
                          onChange={(e) => handleProduct(e, productItem.id)}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) =>
                            handleKeyDown(e, productItem, type, idxRow, idxCol)
                          }
                        />
                      </div>
                    </TA.Td>
                  );
                })}
              </TA.Tr>
            );
          })}
        </tbody>
      </TA.Table>
      {isShowing && (
        <ProductAttributeSort
          attr={order_item.attr_cols!.attr}
          toggleModal={toggle}
        />
      )}
    </>
  );
};
