import React, { useEffect, useRef, useState } from "react";

interface NumberInputBlankProps {
  value: number;
  className?: string;
  min?: number;
  focus?: boolean;
  index?: number;
  setFocus?: (e: number) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NumberInputBlank = ({
  value,
  className,
  min,
  focus,
  index,
  setFocus,
  onChange,
}: NumberInputBlankProps) => {
  const [inputValue, setInputValue] = useState<number | string>(
    value === 0 ? "" : value
  );

  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focus) {
      if (!ref.current) return;
      ref.current.focus();
      ref.current.select();
    }
  }, [focus]);

  return (
    <input
      ref={ref}
      min={min}
      className={className}
      type="number"
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value);
        onChange(e);
        if (setFocus && index) {
          setFocus(index);
        }
      }}
    />
  );
};

export default NumberInputBlank;
