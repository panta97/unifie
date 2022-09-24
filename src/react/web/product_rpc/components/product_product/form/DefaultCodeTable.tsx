import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectProductAttribute,
  selectProductAttrDefaultCode,
  updateAttrDefaultCode,
  updateGroupedAttr,
} from "../../../app/slice/product/productSlice";
import { Switch } from "../../shared/Switch";

export const DefaultCodeTable = () => {
  const attr_default_code = useAppSelector(selectProductAttrDefaultCode);
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
        groupedType: "dc",
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
          groupedType: "dc",
        })
      );
    }
  };

  const handleDefaultCode = (
    e: React.ChangeEvent<HTMLInputElement>,
    attrDefaultCodeIdx: number
  ) => {
    dispatch(
      updateAttrDefaultCode({ defaultCode: e.target.value, attrDefaultCodeIdx })
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
              Referencia Interna
            </th>
            <th className="font-normal w-10/12 p-1">
              <div className="flex flex-row">
                {attrs
                  .filter((attr) => attr.attr.id !== 0)
                  .map((attr, idx) => (
                    <div key={attr.attr.id} className="flex mr-2">
                      <Switch
                        id={`dc-toggle-${idx}`}
                        checked={attr.is_default_code_grouped}
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
          {attr_default_code.map((attrDc, idx) => (
            <tr key={idx} className="even:bg-gray-100">
              <td className="p-1">
                <input
                  className="border rounded px-1"
                  type="text"
                  value={attrDc.default_code}
                  onChange={(e) => handleDefaultCode(e, idx)}
                />
              </td>
              <td className="p-1 whitespace-pre-wrap">
                {attrDc.attr_val_ids.map((attrVal) => attrVal.name).join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
