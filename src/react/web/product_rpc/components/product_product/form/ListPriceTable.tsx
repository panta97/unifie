import React from 'react';
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectProductAttribute,
  selectProductAttrListPrice,
  updateAttrListPrice,
  updateGroupedAttr,
} from "../../../app/slice/product/productSlice";
import { Switch } from "../../shared/Switch";

export const ListPriceTable = () => {
  const attr_list_price = useAppSelector(selectProductAttrListPrice);
  const attrs = useAppSelector(selectProductAttribute);
  const dispatch = useAppDispatch();

  const handleIsGroupedAttribute = (
    e: React.ChangeEvent<HTMLInputElement>,
    attrId: number
  ) => {
    dispatch(
      updateGroupedAttr({
        attrChecked: e.target.checked,
        attrId,
        groupedType: "lp",
      })
    );
  };

  const handleIsGroupedAttributeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    attrId: number
  ) => {
    if (e.key === "Enter") {
      dispatch(
        updateGroupedAttr({
          attrChecked: !e.currentTarget.checked,
          attrId,
          groupedType: "lp",
        })
      );
    }
  };

  const handleListPrice = (
    e: React.ChangeEvent<HTMLInputElement>,
    attrListPriceIdx: number
  ) => {
    dispatch(
      updateAttrListPrice({
        listPrice: Number(e.target.value),
        attrListPriceIdx,
      })
    );
  };

  return (
    <div className="overflow-hidden border border-gray-200 rounded-md">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-500 bg-gray-100">
            <th
              className="font-normal w-2/12 p-1"
              style={{ minWidth: "145px" }}
            >
              Precio Venta
            </th>
            <th className="font-normal w-10/12 p-1">
              <div className="flex flex-row">
                {attrs
                  .filter((attr) => attr.attr.id !== 0)
                  .map((attr, idx) => (
                    <div key={attr.attr.id} className="flex mr-2">
                      <Switch
                        id={`lp-toggle-${idx}`}
                        checked={attr.is_list_price_grouped}
                        onChange={(e) =>
                          handleIsGroupedAttribute(e, attr.attr.id!)
                        }
                        onKeyDown={(e) =>
                          handleIsGroupedAttributeKeyDown(e, attr.attr.id!)
                        }
                      />
                      <label>{attr.attr.name}</label>
                    </div>
                  ))}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {attr_list_price.map((attrLp, idx) => (
            <tr key={idx} className="even:bg-gray-100">
              <td className="p-1">
                <input
                  className="border rounded px-1"
                  type="number"
                  min={1}
                  value={attrLp.list_price}
                  onChange={(e) => handleListPrice(e, idx)}
                />
              </td>
              <td className="p-1 whitespace-pre-wrap">
                {attrLp.attr_val_ids.map((attrVal) => attrVal.name).join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
