import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
  selectProductAttrDefaultCode,
  selectProductDefaultCode,
  updateDefaultCode,
} from "../../../../app/slice/product/productSlice";

export const DefaultCodeField = () => {
  const default_code = useAppSelector(selectProductDefaultCode);
  const attr_default_code = useAppSelector(selectProductAttrDefaultCode);

  const dispatch = useAppDispatch();

  const handleDefaultCodeAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    dispatch(updateDefaultCode({ defaultCode: newValue }));
  };

  return (
    <>
      {attr_default_code.length === 0 && (
        <div className="inline-flex flex-col w-40 mr-1">
          <label htmlFor="default_code" className="text-xs">
            Referencia Interna
          </label>
          <input
            className="border border-gray-300 rounded text-sm px-1"
            type="text"
            autoComplete="off"
            spellCheck={false}
            id="default_code"
            name="default_code"
            value={default_code}
            onChange={handleDefaultCodeAll}
          />
        </div>
      )}
    </>
  );
};
