import React, { Fragment, ReactNode } from "react";
import { useAppSelector } from "../app/hooks";

interface PrintValidatorProps {
  children: ReactNode;
}

export const PrintValidator = ({ children }: PrintValidatorProps) => {
  const isSessionClosed = useAppSelector(
    (root) => root.pos.summary.isSessionClosed
  );
  const isPosSaved = useAppSelector((root) => root.pos.isPOSStateSaved);
  const msjs: ReactNode[] = [];

  if (!isSessionClosed)
    msjs.push(
      <div key={1} className="uppercase">
        cerrar caja
      </div>
    );
  if (!isPosSaved)
    msjs.push(
      <div key={2} className="uppercase">
        guardar cuadre
      </div>
    );

  if (!isSessionClosed || !isPosSaved)
    return <Fragment>{msjs.map((msj) => msj)}</Fragment>;
  else return <Fragment>{children}</Fragment>;
};
