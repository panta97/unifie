import { useRef } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { AttributeVal } from "../../types/attribute";
import { Svg } from "../shared/Svg";
import { TableAttr as TA } from "../shared/table/TableAttr";

interface SortTableProps {
  attributeVals: AttributeVal[];
  reorderAttr: (sourceIndex: number, destIndex: number) => void;
}

export const SortTable = ({ attributeVals, reorderAttr }: SortTableProps) => {
  const thRefOrder = useRef<HTMLTableHeaderCellElement>(null);
  const thRefName = useRef<HTMLTableHeaderCellElement>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderAttr(result.source.index, result.destination.index);
  };

  return (
    <div className="text-sm">
      <TA.Table>
        <thead>
          <TA.Tr>
            <TA.Th ref={thRefOrder}>Orden</TA.Th>
            <TA.Th ref={thRefName}>Nombre</TA.Th>
          </TA.Tr>
        </thead>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="ddr">
            {(provided, snapshot) => (
              <tbody {...provided.droppableProps} ref={provided.innerRef}>
                {attributeVals.map((attr, idx) => (
                  <Draggable
                    key={attr.id}
                    draggableId={String(attr.id)}
                    index={idx}
                  >
                    {(provided, snapshot) => (
                      <tr
                        key={attr.id}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border-b border-gray-200 bg-gray-100 text-gray-500 last:border-b-0"
                      >
                        <TA.Td
                          style={{
                            minWidth: `${
                              thRefOrder.current?.getBoundingClientRect().width
                            }px`,
                          }}
                        >
                          <div className="flex justify-between">
                            <span
                              {...provided.dragHandleProps}
                              tabIndex={-1}
                              className="flex items-center"
                            >
                              <Svg.MenuAlt2 className="h-4 w-4" />
                            </span>
                            <span>{idx + 1}</span>
                          </div>
                        </TA.Td>
                        <TA.Td
                          style={{
                            minWidth: `${
                              thRefName.current?.getBoundingClientRect().width
                            }px`,
                          }}
                        >
                          {attr.name}
                        </TA.Td>
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            )}
          </Droppable>
        </DragDropContext>
      </TA.Table>
    </div>
  );
};
