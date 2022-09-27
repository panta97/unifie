import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { reorderCols } from "../../app/slice/order/orderItemSlice";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { AttributeVal } from "../../types/attribute";
import { fetchResult, FetchStatus } from "../../types/fetch";
import { CatalogGeneric } from "../../types/shared";
import { reorder } from "../../utils/utils";
import { Loader } from "../shared/Loader";
import { ModalWrapper } from "../shared/ModalWrapper";
import { SortTable } from "./SortTable";

interface ProductAttributeSortProps {
  attr: CatalogGeneric;
  toggleModal: () => void;
}

export const ProductAttributeSort = ({
  attr,
  toggleModal,
}: ProductAttributeSortProps) => {
  const [attributeVals, setAttributeVals] = useState<AttributeVal[]>([]);
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const divRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(divRef, () => toggleModal());
  const dispatch = useAppDispatch();

  const fetchAttributeVals = useCallback(async () => {
    const response = await fetch(
      `/api/product-rpc/attribute/list?attrId=${attr.id}`
    );
    const result = await response.json();
    setAttributeVals(result.attribute_vals as AttributeVal[]);
  }, [attr.id]);

  const updateAttributeVals = async () => {
    try {
      setStatus(FetchStatus.LOADING);
      const response = await fetch(
        `/api/product-rpc/attribute/sort?attrId=${attr.id}`,
        {
          method: "POST",
          body: JSON.stringify({
            new_attrs_sort: attributeVals,
          }),
        }
      );
      const json = await response.json();
      if (json.result === fetchResult.SUCCESS) {
        dispatch(reorderCols({ attributeVals: attributeVals }));
        toggleModal();
      }
      if (json.result === fetchResult.ERROR) throw new Error(json.message);
    } catch (error) {
      alert(error);
    } finally {
      setStatus(FetchStatus.IDLE);
    }
  };

  const reorderAttr = (sourceIndex: number, destIndex: number) => {
    setAttributeVals((prevAttrVals) => {
      const newAttrVals = reorder(
        prevAttrVals,
        sourceIndex,
        destIndex
      ) as AttributeVal[];
      // keep sort order the same
      const attrValsSort = prevAttrVals.map((attr) => attr.sort!);
      newAttrVals.forEach((newAttr, idx) => (newAttr.sort = attrValsSort[idx]));
      return newAttrVals;
    });
  };

  useEffect(() => {
    fetchAttributeVals();
  }, [fetchAttributeVals]);

  return (
    <ModalWrapper>
      <div
        ref={divRef}
        className="bg-white rounded overflow-scroll p-4"
        style={{ width: "400px", height: "500px" }}
      >
        <div className="border-b text-gray-700 pb-2 mb-2 text-sm flex justify-between">
          <p className="flex items-center">{attr.name}</p>
          <div>
            <button
              className="rounded bg-gray-100 px-2 py-1"
              onClick={updateAttributeVals}
            >
              Actualizar
            </button>
          </div>
        </div>
        <div className="flex justify-center">
          <SortTable attributeVals={attributeVals} reorderAttr={reorderAttr} />
        </div>
      </div>
      <Loader fetchStatus={status} portal={true} />
    </ModalWrapper>
  );
};
