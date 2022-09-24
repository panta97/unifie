import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { selectCatalogs } from "../../../../app/slice/product/catalogSlice";
import {
  selectProductPosId,
  updatePosCat,
} from "../../../../app/slice/product/productSlice";
import { Select } from "../../../shared/Select";

export const PosCategoryField = () => {
  const catalogs = useAppSelector(selectCatalogs);
  const posId = useAppSelector(selectProductPosId);
  const dispatch = useAppDispatch();

  const handlePosCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    dispatch(
      updatePosCat({ posCatId: newId, posCategories: catalogs.pos_category })
    );
  };

  return (
    <div className="inline-flex flex-col w-48 mr-1">
      <label htmlFor="pos_cat" className="text-xs">
        Categoría POS
      </label>
      <Select
        id={posId}
        handler={handlePosCategory}
        catalog={catalogs.pos_category}
        name={"pos_cat"}
        autoFocus={false}
      />
    </div>
  );
};
