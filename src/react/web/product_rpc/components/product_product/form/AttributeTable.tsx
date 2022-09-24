import React, { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectCatalogs } from "../../../app/slice/product/catalogSlice";
import {
  addAttr,
  deleteAttr,
  selectProductAttribute,
  updateAttr,
  updateAttrVal,
  updateIsEditingAttr,
} from "../../../app/slice/product/productSlice";
import { TagData } from "../../../types/tag";
import { Select } from "../../shared/Select";
import { Svg } from "../../shared/Svg";
import { TagInput } from "../../shared/TagInput";

export const AttributeTable = () => {
  const catalogs = useAppSelector(selectCatalogs);
  const attrs = useAppSelector(selectProductAttribute);
  const dispatch = useAppDispatch();

  const handleAttribute = (
    e: React.ChangeEvent<HTMLSelectElement>,
    attrIndex: number
  ) => {
    const attrId = Number(e.target.value);
    dispatch(
      updateAttr({
        attrId,
        attrIndex,
        attributes: catalogs.product_attribute,
      })
    );
  };

  const handleAttributeValue = useCallback(
    (newTags: TagData[], attrId: number) => {
      dispatch(updateAttrVal({ attrId, newTags }));
    },
    [dispatch]
  );

  const handleAddAttribute = () => {
    dispatch(addAttr());
  };

  const handleDeleteAttribute = (attrId: number) => {
    dispatch(deleteAttr({ attrId }));
  };

  const handleEditAttribute = (attrIndex: number) => {
    if (!attrs[attrIndex]?.editing)
      dispatch(updateIsEditingAttr({ attrIndex }));
  };

  return (
    <div className="border border-gray-200 overflow-hidden rounded-md">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-100 text-gray-500">
            <th
              style={{ minWidth: "274px" }}
              className="text-left text-xs font-normal p-1"
            >
              Atributo
            </th>
            <th
              className="text-left text-xs font-normal w-full p-1"
              colSpan={2}
            >
              Valores de Atributo
            </th>
          </tr>
        </thead>
        <tbody>
          {attrs.map((attribute, idx) => (
            <tr
              className="border-b border-gray-200"
              key={idx}
              onClick={() => handleEditAttribute(idx)}
            >
              <td className="p-1">
                {attribute.editing && attribute.attr_vals.length === 0 ? (
                  <Select
                    id={attribute.attr.id!}
                    handler={(e) => handleAttribute(e, idx)}
                    catalog={catalogs.product_attribute}
                    name={"attr"}
                    autoFocus={true}
                  />
                ) : (
                  <span className="text-sm">{attribute.attr.name}</span>
                )}
              </td>
              <td className="p-1">
                {attribute.editing ? (
                  <TagInput
                    tagData={catalogs.product_attribute_value.filter(
                      (attrVal) => attrVal.attribute_id === attribute.attr.id
                    )}
                    updateTags={handleAttributeValue}
                    currTags={attribute.attr_vals as TagData[]}
                    groupId={attribute.attr.id!}
                  />
                ) : (
                  <div className="flex items-start flex-wrap">
                    {attribute.attr_vals.map((attrVal) => (
                      <span
                        className="rounded px-1 mr-0.5 mt-0.5 bg-gray-200 text-sm inline-block whitespace-pre-wrap"
                        key={attrVal.id}
                      >
                        {attrVal.name}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="p-1">
                <span title="Eliminar">
                  <Svg.Trash
                    className={`h-5 w-5 ml-auto cursor-pointer`}
                    onClick={() => handleDeleteAttribute(attribute.attr.id!)}
                  />
                </span>
              </td>
            </tr>
          ))}
          <tr>
            <td className="px-1" colSpan={3}>
              <button
                onClick={handleAddAttribute}
                className="inline text-xs italic underline hover:text-blue-600 cursor-pointer"
              >
                Añadir nuevo atributo
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
