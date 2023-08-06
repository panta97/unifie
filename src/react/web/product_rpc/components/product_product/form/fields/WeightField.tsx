import React from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";

import { updateWeight } from "../../../../app/slice/product/productSlice";

export const WeightField = () => {
  const weight = useAppSelector((state) => state.product.product.weight);
  const dispatch = useAppDispatch();

  const handleWeight = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeight = e.target.valueAsNumber;
    dispatch(updateWeight({ weight: newWeight }));
  };

  return (
    <div className="inline-flex flex-col w-24 mr-1">
      <label htmlFor="weight" className="text-xs">
        Peso en kg
      </label>
      <input
        className="border border-gray-300 rounded text-sm px-1"
        type="number"
        id="weight"
        name="weight"
        spellCheck={false}
        value={weight}
        onChange={handleWeight}
      ></input>
    </div>
  );
};
