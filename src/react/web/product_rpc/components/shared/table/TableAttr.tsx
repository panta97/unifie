import React, { forwardRef } from "react";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

const Table = ({ children, className }: TableProps) => {
  return (
    <div
      className={`inline-block border border-gray-200 overflow-hidden rounded-md mb-3 ${
        className ? className : ""
      }`}
    >
      <table>{children}</table>
    </div>
  );
};

interface TrProps {
  children: React.ReactNode;
  className?: string;
}

const Tr = ({ children, className }: TrProps) => {
  return (
    <tr
      className={`border-b border-gray-200 bg-gray-100 text-gray-500 ${
        className ? className : ""
      }`}
    >
      {children}
    </tr>
  );
};

interface ThProps {
  children?: React.ReactNode;
  colSpan?: number;
}

const Th = forwardRef<HTMLTableHeaderCellElement, ThProps>(
  ({ children, colSpan }, ref) => {
    return (
      <th
        ref={ref}
        className="text-center border-r last:border-r-0 font-normal p-1"
        colSpan={colSpan}
      >
        {children}
      </th>
    );
  }
);

interface TdProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const Td = ({ children, style }: TdProps) => {
  return (
    <td
      className="text-center border-r last:border-r-0 font-normal p-1"
      style={style}
    >
      {children}
    </td>
  );
};

export const TableAttr = {
  Table,
  Tr,
  Th,
  Td,
};
