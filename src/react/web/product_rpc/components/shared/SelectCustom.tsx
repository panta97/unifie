import React, { useRef, useState } from "react";
import { TagData } from "../../types/tag";
import { DataList } from "./DataList";
import { useDataList } from "../../hooks/useDataList";

interface SelectCustomProps<T> {
  currTag: T;
  tagData: T[];
  updateTag: (newTag: T) => void;
  filterTags: (tag: T, inputVal: string) => boolean;
  className?: string;
}

export const SelectCustom = <T extends TagData>({
  currTag,
  tagData,
  updateTag,
  filterTags,
  className,
}: SelectCustomProps<T>) => {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    suggestions,
    currSuggestId,
    handleChange: handleChangeDL,
    handleKeyEnter: handleKeyEnterDL,
    handleKeyArrow: handleKeyArrowDL,
  } = useDataList<T>(listRef);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    const filteredSuggestions = tagData.filter((tag) =>
      filterTags(tag, newInput)
    );
    setInput(newInput);
    handleChangeDL(filteredSuggestions);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const currSuggestId = handleKeyEnterDL();
      const newTag = suggestions.find(
        (suggest) => suggest.id === currSuggestId
      );
      if (newTag && input) {
        updateTag(newTag);
        setInput("");
        handleChangeDL(suggestions);
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      handleKeyArrowDL(e.key);
    }
  };

  const handleReset = () => {
    updateTag({ id: 0, name: "" } as T);
    setInput("");
  };

  const handleSetTag = (tag: T) => {
    updateTag(tag);
    setInput("");
  };

  return (
    <>
      {currTag.id !== 0 ? (
        <div
          className={`border rounded px-1 text-sm inline-flex justify-between ${className}`}
        >
          <div
            className="inline-block whitespace-nowrap overflow-hidden overflow-ellipsis"
            style={{ width: "97%" }}
            title={currTag.name}
          >
            {currTag.name}
          </div>
          <span
            className="inline-block cursor-pointer"
            tabIndex={0}
            onClick={handleReset}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleReset();
            }}
          >
            &times;
          </span>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            className={`border rounded px-1 text-sm ${className}`}
            type="text"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          {input && suggestions.length > 0 && (
            <DataList
              suggestions={suggestions}
              currSuggestId={currSuggestId}
              setTag={handleSetTag as (tag: TagData) => void}
              rect={inputRef.current?.getBoundingClientRect()}
              ref={listRef}
            />
          )}
        </>
      )}
    </>
  );
};
