import React from "react";

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export const Switch = ({ id, checked, onChange, onKeyDown }: SwitchProps) => {
  return (
    <div
      className={`relative inline-block rounded-full w-8 h-4 transition duration-200 ease-linear mr-1 ${
        checked ? "bg-emerald-400" : "bg-gray-400"
      }`}
    >
      <label
        htmlFor={id}
        className={`absolute left-0 bg-white border-2 w-4 h-4 rounded-full transition transform duration-100 ease-linear cursor-pointer ${
          checked
            ? "translate-x-full border-emerald-400"
            : "translate-x-0 border-gray-400"
        }`}
      />
      <input
        id={id}
        type="checkbox"
        className="appearance-none w-full h-full"
        checked={checked}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};
