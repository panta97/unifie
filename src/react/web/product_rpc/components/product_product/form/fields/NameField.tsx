import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
  selectProductName,
  updateName,
} from "../../../../app/slice/product/productSlice";

export const NameField = () => {
  const name = useAppSelector(selectProductName);
  const dispatch = useAppDispatch();

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    dispatch(updateName({ name: newValue }));
  };

  return (
    <div className="inline-flex flex-col w-full">
      <label htmlFor="product_name" className="text-xs">
        Nombre
      </label>
      <input
        className="border-b-2 border-gray-500 text px-1"
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={name}
        onChange={handleName}
        id="product_name"
      ></input>
    </div>
  );
};
