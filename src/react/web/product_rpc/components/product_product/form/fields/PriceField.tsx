import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
  selectProductAttrListPrice,
  selectProductListPrice,
  updateListPrice,
} from "../../../../app/slice/product/productSlice";

export const PriceField = () => {
  const list_price = useAppSelector(selectProductListPrice);
  const attr_list_price = useAppSelector(selectProductAttrListPrice);

  const dispatch = useAppDispatch();

  const handleListPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.valueAsNumber;
    dispatch(updateListPrice({ listPrice: newValue }));
  };

  return (
    <>
      {attr_list_price.length === 0 && (
        <div className="inline-flex flex-col w-24 mr-1">
          <label htmlFor="price" className="text-xs">
            Precio Venta
          </label>
          <input
            className="border border-gray-300 rounded text-sm px-1"
            type="number"
            id="price"
            name="price"
            min={1}
            value={list_price}
            onChange={handleListPrice}
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
    </>
  );
};
