import "./animation.css";
import { createPortal } from "react-dom";
import { fetchStatus } from "../../app/slice/pos/posType";

interface LoaderProps {
  fetchStatus: fetchStatus;
}

export const Loader = ({ fetchStatus }: LoaderProps) => {
  const loaderEle = (
    <div
      className={`fixed z-50 font-sans left-0 top-0 w-full h-full text-gray-700 bg-black bg-opacity-30${
        fetchStatus === "loading" ? "" : " hidden"
      }`}
    >
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex items-center rounded p-2 bg-white">
          <span className="text-sm">Cargando</span>
          <div className="lds-dual-ring"></div>
        </div>
      </div>
    </div>
  );

  return createPortal(loaderEle, document.getElementById("portal")!);
};
