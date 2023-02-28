import React, { useState } from "react";

interface NumberInputBlankProps {
  value: number;
  className?: string;
  min?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NumberInputBlank = ({
  value,
  className,
  min,
  onChange,
}: NumberInputBlankProps) => {
  const [inputValue, setInputValue] = useState<number | string>(
    value === 0 ? "" : value
  );

  return (
    <input
      min={min}
      className={className}
      type="number"
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value);
        onChange(e);
      }}
    />
  );
};

export default NumberInputBlank;
