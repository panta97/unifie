import React from "react";

interface WrapperProps {
  children: React.ReactNode;
}

export const Wrapper = ({ children }: WrapperProps) => {
  return (
    <div className="border border-gray-500 m-3 p-3 border-dashed text-gray-800 min-w-[600px]">
      {children}
    </div>
  );
};
