import { useEffect, useRef } from "react";
import { useDataList } from "../../../../hooks/useDataList";
import { useDebouncedSearch } from "../../../../hooks/useDebounceSearch";
import { TagData } from "../../../../types/tag";
import { DataList } from "../../../shared/DataList";
import { useFetchOrderItem } from "../../shared";

const searchProductsAsync = async (name: string) => {
  return (await fetch(`/api/product-rpc/purchase_order/product?name=${name}`)).json();
};
const useSearchProducts = () =>
  useDebouncedSearch((name) => searchProductsAsync(name));

export const OrderItemSearch = () => {
  const { inputText, setInputText, searchResults } = useSearchProducts();
  const { getOrderItem } = useFetchOrderItem();
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    suggestions,
    currSuggestId,
    handleChange: handleChangeDL,
    handleKeyEnter: handleKeyEnterDL,
    handleKeyArrow: handleKeyArrowDL,
  } = useDataList<TagData>(listRef);

  useEffect(() => {
    setSuggestions(searchResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults.result]);

  const setSuggestions = (results: typeof searchResults) => {
    let newSuggestions: TagData[] = [];
    if (results.loading) {
      newSuggestions.push({ id: 0, name: "cargando..." });
      handleChangeDL(newSuggestions);
    } else if (results.error) {
      newSuggestions.push({ id: 0, name: `Error: ${results.error.message}` });
      handleChangeDL(newSuggestions);
    } else if (results.result.products) {
      newSuggestions = results.result.products as TagData[];
      handleChangeDL(newSuggestions);
    }
  };

  const handleSetSuggestion = (tag: TagData) => {
    if (tag.id < 1) return;
    setInputText("");
    getOrderItem(tag.id, "product_product");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // avoid when suggest id is set to loading
      if (currSuggestId < 1) return;
      const rCurrSuggestId = handleKeyEnterDL();
      setInputText("");
      getOrderItem(rCurrSuggestId, "product_product");
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      handleKeyArrowDL(e.key);
    }
  };

  return (
    <div className="inline-flex flex-col w-80">
      <label htmlFor="tmpl_id" className="text-xs">
        Producto
      </label>
      <input
        ref={inputRef}
        className="border rounded text-sm px-1"
        type="text"
        autoComplete="off"
        spellCheck={false}
        id="tmpl_id"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {inputText && suggestions.length > 0 && (
        <DataList
          suggestions={suggestions}
          currSuggestId={currSuggestId}
          setTag={handleSetSuggestion}
          rect={inputRef.current?.getBoundingClientRect()}
          ref={listRef}
          style={{
            minWidth: `${inputRef.current?.getBoundingClientRect().width}px`,
            width: "auto",
          }}
        />
      )}
    </div>
  );
};
