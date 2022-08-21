import {
  HEADER_HEIGHT,
  LINE_HEIGHT,
  PADDING_HEIGHT,
} from "../../logic/constants";
import {
  IOrderDetailsGrouped,
  IOrderLineGrouped,
} from "../../logic/rowHandler";

interface ListProps {
  order_details: IOrderDetailsGrouped;
  order_lines: IOrderLineGrouped[];
}

export const List = ({ order_details, order_lines }: ListProps) => {
  return (
    <div
      className="text-xs border-b border-black border-dashed mb-2"
      style={{
        height: `${850 + (order_details.page === 1 ? 0 : HEADER_HEIGHT + 5)}px`,
      }}
    >
      <div className="font-semibold">
        <span className="border-l border-t border-r border-b border-black p-1 inline-block w-[65%]">
          DESCRIPCIÓN
        </span>
        <span className="border-t border-r border-b border-black p-1 inline-block w-[15%]">
          MARCA
        </span>
        <span className="border-t border-r border-b border-black p-1 inline-block w-[5%]">
          CNT
        </span>
        <span className="border-t border-r border-b border-black p-1 inline-block w-[calc(15%/3)]">
          ALM
        </span>
        <span className="border-t border-r border-b border-black p-1 inline-block w-[calc(15%/3)]">
          VAL
        </span>
        <span className="border-t border-r border-b border-black p-1 inline-block w-[calc(15%/3)]">
          OBS
        </span>
      </div>
      {order_lines.map((line, idx) => (
        <div
          key={idx}
          className="flex even:bg-gray-200"
          style={{
            height: `${LINE_HEIGHT * line.lineHeight + PADDING_HEIGHT}px`,
          }}
        >
          <div className="border-l border-r border-b border-black p-1 inline-flex items-center break-all w-[65%]">
            <span className="">{line.name}</span>
          </div>
          <div className="border-r border-b border-black p-1 inline-flex items-center break-all w-[15%]">
            <span className="">{line.cats.split(" / ")[2]}</span>
          </div>
          <div className="border-r border-b border-black p-1 inline-flex items-center w-[5%]">
            <span className="">{line.quantity}</span>
          </div>
          <div className="border-r border-b border-black p-1 inline-flex items-center justify-center w-[calc(15%/3)]"></div>
          <div className="border-r border-b border-black p-1 inline-flex items-center justify-center w-[calc(15%/3)]"></div>
          <div className="border-r border-b border-black p-1 inline-flex items-center justify-center w-[calc(15%/3)]"></div>
        </div>
      ))}
    </div>
  );
};
