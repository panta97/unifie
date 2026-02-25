import React from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
  selectProductLot,
  updateLot,
} from "../../../../app/slice/product/productSlice";
import { selectCatalogs } from "../../../../app/slice/product/catalogSlice";
import { Switch } from "../../../shared/Switch";

export const LotsField = () => {
  const lot = useAppSelector(selectProductLot);
  const catalogs = useAppSelector(selectCatalogs);
  const dispatch = useAppDispatch();

  if (!catalogs.show_lots) return null;

  const handleLotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateLot({ lot: e.target.checked }));
  };
  return (
    <>
      <div className="inline-flex flex-col w-40 mr-1">
        <label htmlFor="lots" className="text-xs mb-1">
          Lotes
        </label>
        <Switch id="lots" checked={lot} onChange={handleLotChange} />
      </div>
    </>
  );
};
