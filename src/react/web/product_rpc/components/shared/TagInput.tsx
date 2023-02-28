import React, { useEffect, useRef, useState } from "react";
import { useDataList } from "../../hooks/useDataList";
import { TagData } from "../../types/tag";
import { DataList } from "./DataList";

interface TagInputProps {
  tagData: TagData[];
  currTags: TagData[];
  updateTags: (newTags: TagData[], groupId: number) => void;
  groupId: number;
}

export const TagInput = ({
  tagData,
  currTags,
  updateTags,
  groupId,
}: TagInputProps) => {
  const [input, setInput] = useState("");
  const [tags, setTags] = useState<TagData[]>(currTags);
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
    updateTags(tags, groupId);
  }, [updateTags, tags, groupId]);

  const getSuggestions = (
    tagData: TagData[],
    tags: TagData[],
    tag: TagData | undefined = undefined
  ) => {
    const tagIds = tags.map((tag) => tag.id);
    let suggestions: TagData[] = tagData.filter((suggest) => {
      return !tagIds.includes(suggest.id);
    });
    if (tag)
      suggestions = suggestions.filter((suggest) => suggest.id !== tag.id);
    return suggestions;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    let suggestions = getSuggestions(tagData, tags);
    suggestions = suggestions.filter((suggest) => {
      return suggest.name.toLowerCase().includes(newInput.toLowerCase());
    });
    setInput(newInput);
    handleChangeDL(suggestions);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const currSuggestId = handleKeyEnterDL();
      const newTag = suggestions.find(
        (suggest) => suggest.id === currSuggestId
      );
      if (newTag && input) {
        const newTags = [...tags, newTag];
        const suggestions = getSuggestions(tagData, newTags);
        setInput("");
        setTags(newTags);
        handleChangeDL(suggestions);
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      handleKeyArrowDL(e.key);
    } else if (e.key === "Backspace" && input === "") {
      e.preventDefault();
      const newTags = tags.slice(0, tags.length - 1);
      setTags(newTags);
    }
  };

  const handleDelete = (id: number) => {
    const newTags = tags.filter((tag) => tag.id !== id);
    const suggestions = tagData.filter(
      (suggest) => !newTags.map((tag) => tag.id).includes(suggest.id)
    );
    setTags(newTags);
    handleChangeDL(suggestions);
  };

  const addTags = (tag: TagData) => {
    const suggestions = getSuggestions(tagData, tags, tag);
    setTags([...tags, tag]);
    setInput("");
    handleChangeDL(suggestions);
  };

  return (
    <div className="flex items-start flex-wrap">
      {tags.map((tag) => (
        <span
          className="rounded px-1 mr-0.5 mt-0.5 bg-gray-200 text-sm inline-block whitespace-pre-wrap"
          key={tag.id}
        >
          {tag.name}
          <span
            className="pl-1 cursor-pointer"
            onClick={() => handleDelete(tag.id)}
          >
            &times;
          </span>
        </span>
      ))}
      <div>
        <input
          ref={inputRef}
          className="px-1 text-sm w-48 outline-none"
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="agregar atributo"
        />
        {input && suggestions.length > 0 && (
          <DataList
            suggestions={suggestions}
            currSuggestId={currSuggestId}
            setTag={addTags}
            rect={inputRef.current?.getBoundingClientRect()}
            ref={listRef}
          />
        )}
      </div>
    </div>
  );
};
