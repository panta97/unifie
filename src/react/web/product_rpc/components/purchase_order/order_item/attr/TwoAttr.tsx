import { OrderItem, ProductItem } from "../../../../types/purchaseOrder";
import { ItemTableType } from "./OrderItemAttr";
import { TableAttr as TA } from "../../../shared/table/TableAttr";
import { Svg } from "../../../shared/Svg";
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import { useRef } from "react";
import { useAppDispatch } from "../../../../app/hooks";
import {
  fillProductItemValue,
  fillProductItemValueAll,
  reorderRows,
} from "../../../../app/slice/order/orderItemSlice";
import { useModal } from "../../../../hooks/useModal";
import { ProductAttributeSort } from "../../../product_attribute/ProductAttributeSort";
import { OrderItemInput } from "./OrderItemInput";
import { StrictModeDroppable } from "../../../shared/StrictModeDroppable";

interface TwoAttrProps {
  title: string;
  type: ItemTableType;
  order_item: OrderItem;
  handleDeleteRow: (attrRowId: number) => void;
  handleDeleteCol: (attrColId: number) => void;
  handleProduct: (e: any, productId: number) => void;
}

export const TwoAttr = ({
  title,
  type,
  order_item,
  handleDeleteRow,
  handleDeleteCol,
  handleProduct,
}: TwoAttrProps) => {
  const dispatch = useAppDispatch();
  const { isShowing, toggle } = useModal();
  const thRef = useRef<HTMLTableHeaderCellElement>(null);

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    dispatch(
      reorderRows({
        sourceIndex: result.source.index,
        destIndex: result.destination.index,
      })
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    productItem: ProductItem,
    type: ItemTableType,
    posX: number,
    posY: number
  ) => {
    if (e.shiftKey && e.ctrlKey && e.key === "ArrowUp") {
      e.preventDefault();
      dispatch(
        fillProductItemValue({ productItem, type, dir: "up", posX, posY })
      );
    } else if (e.shiftKey && e.ctrlKey && e.key === "ArrowDown") {
      e.preventDefault();
      dispatch(
        fillProductItemValue({ productItem, type, dir: "down", posX, posY })
      );
    } else if (e.shiftKey && e.ctrlKey && e.key === "ArrowRight")
      dispatch(
        fillProductItemValue({ productItem, type, dir: "right", posX, posY })
      );
    else if (e.shiftKey && e.ctrlKey && e.key === "ArrowLeft")
      dispatch(
        fillProductItemValue({ productItem, type, dir: "left", posX, posY })
      );
    else if (e.shiftKey && e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      dispatch(fillProductItemValueAll({ type, dir: "up", posX, posY }));
    } else if (e.shiftKey && e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      dispatch(fillProductItemValueAll({ type, dir: "down", posX, posY }));
    } else if (e.shiftKey && e.altKey && e.key === "ArrowRight")
      dispatch(fillProductItemValueAll({ type, dir: "right", posX, posY }));
    else if (e.shiftKey && e.altKey && e.key === "ArrowLeft")
      dispatch(fillProductItemValueAll({ type, dir: "left", posX, posY }));
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
            <TA.Th ref={thRef}>{order_item.attr_rows!.attr.name}</TA.Th>
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
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <StrictModeDroppable droppableId="ddr">
            {(provided, snapshot) => (
              <tbody {...provided.droppableProps} ref={provided.innerRef}>
                {order_item.product_matrix.map((productRow, idxRow) => (
                  <Draggable
                    key={productRow.id}
                    draggableId={String(productRow.id)}
                    index={idxRow}
                  >
                    {(provided, snapshot) => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border-b border-gray-200 bg-gray-100 text-gray-500 last:border-b-0"
                      >
                        <TA.Td
                          style={{
                            minWidth: `${
                              thRef.current?.getBoundingClientRect().width
                            }px`,
                          }}
                        >
                          <div className="flex justify-between">
                            <span
                              {...provided.dragHandleProps}
                              tabIndex={-1}
                              className={`flex items-center${
                                order_item.attr_rows!.attr_vals.length > 1
                                  ? ""
                                  : " invisible"
                              }`}
                            >
                              <Svg.MenuAlt2 className="h-4 w-4" />
                            </span>
                            <span>
                              {order_item.attr_rows!.attr_vals[idxRow].name}
                            </span>
                            <span
                              title="Eliminar"
                              className="cursor-pointer"
                              onClick={() =>
                                handleDeleteRow(
                                  order_item.attr_rows!.attr_vals[idxRow].id
                                )
                              }
                            >
                              &times;
                            </span>
                          </div>
                        </TA.Td>
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
                                  onChange={(e) =>
                                    handleProduct(e, productItem.id)
                                  }
                                  onFocus={(e) => e.target.select()}
                                  onKeyDown={(e) =>
                                    handleKeyDown(
                                      e,
                                      productItem,
                                      type,
                                      idxRow,
                                      idxCol
                                    )
                                  }
                                />
                              </div>
                            </TA.Td>
                          );
                        })}
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            )}
          </StrictModeDroppable>
        </DragDropContext>
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
