import React from 'react';
import "../../styles/animation.css";
import { createPortal } from "react-dom";
import { FetchStatus } from "../../types/fetch";

interface LoaderProps {
  fetchStatus: FetchStatus;
  portal: boolean;
}

// when portal is set to false parent element must have its position set to relative
export const Loader = ({ fetchStatus, portal }: LoaderProps) => {
  const loaderEle = (
    <div
      className={`${
        portal ? "fixed z-50 " : "absolute "
      }font-sans left-0 top-0 w-full h-full text-gray-700 bg-black bg-opacity-30${
        fetchStatus === FetchStatus.LOADING ? "" : " hidden"
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

  if (portal)
    return createPortal(loaderEle, document.getElementById("portal")!);
  else return loaderEle;
};
