import { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalWrapperProps {
  children: ReactNode;
}

export const ModalWrapper = ({ children }: ModalWrapperProps) => {
  return createPortal(
    <div className="fixed left-0 top-0 w-full h-full bg-black bg-opacity-30">
      <div className="flex items-center justify-center w-full h-full">
        {children}
      </div>
    </div>,
    document.getElementById("portal")!
  );
};
