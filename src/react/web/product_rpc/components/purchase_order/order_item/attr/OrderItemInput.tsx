import React from "react";
import "./orderItem.css";

interface OrderItemInputProps {
  value: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const OrderItemInput = ({
  value,
  onChange,
  onFocus,
  onKeyDown,
}: OrderItemInputProps) => {
  return (
    <input
      style={{ width: "60px" }}
      type="number"
      min={0}
      className="rounded px-1 appearance-none order-item-input"
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    />
  );
};
