import React from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { selectCatalogs } from "../../../../app/slice/product/catalogSlice";
import {
    selectProductLastId,
    selectProductBrandId,
    updateLast,
} from "../../../../app/slice/product/productSlice";
import { Select } from "../../../shared/Select";

export const CategoryLastField = () => {
    const catalogs = useAppSelector(selectCatalogs);
    const brandId = useAppSelector(selectProductBrandId);
    const lastId = useAppSelector(selectProductLastId);
    const dispatch = useAppDispatch();

    const handleCategoryLast = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = Number(e.target.value);
        dispatch(
            updateLast({
                categoryLastId: newId,
                categoryLasts: catalogs.product_category_last,
            })
        );
    };

    return (
        <div className="inline-flex flex-col w-40 mr-1">
            <label htmlFor="cat_last" className="text-xs">
                Categoría 3
            </label>
            <Select
                id={lastId}
                handler={handleCategoryLast}
                catalog={(catalogs.product_category_last ?? []).filter(
                    (catLast) => catLast.parent_id === brandId
                )}
                name={"cat_last"}
                autoFocus={false}
            />
        </div>
    );
};
