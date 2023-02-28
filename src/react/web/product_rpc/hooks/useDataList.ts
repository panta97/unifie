import React, { Reducer, useReducer } from "react";
import { TagData } from "../types/tag";

interface State<T> {
  suggestions: T[];
  currSuggestId: number;
}

interface Action<T> {
  type: string;
  payload: Partial<State<T>>;
}

// TODO: simplify reducer logic or split it with useState
const reducer = <T extends TagData>(state: State<T>, action: Action<T>) => {
  switch (action.type) {
    case "UPDATE": {
      return {
        ...state,
        ...action.payload,
      };
    }
    default:
      return {
        suggestions: [],
        currSuggestId: 0,
      };
  }
};

export const useDataList = <T extends TagData>(
  listRef: React.RefObject<HTMLUListElement>
) => {
  const [{ suggestions, currSuggestId }, dispatch] = useReducer<
    Reducer<State<T>, Action<T>>
  >(reducer, {
    suggestions: [],
    currSuggestId: 0,
  });

  const handleChange = (newSuggestions: T[]) => {
    dispatch({
      type: "UPDATE",
      payload: {
        suggestions: newSuggestions,
        currSuggestId: newSuggestions.length > 0 ? newSuggestions[0].id : 0,
      },
    });
  };

  const handleKeyEnter = (): number => {
    const newTag = suggestions.find((suggest) => suggest.id === currSuggestId);
    if (newTag) {
      dispatch({
        type: "UPDATE",
        payload: {
          suggestions: [],
          currSuggestId: 0,
        },
      });
      return currSuggestId;
    }
    return -1;
  };

  const handleKeyArrow = (key: string) => {
    if (key === "Enter") {
      const newTag = suggestions.find(
        (suggest) => suggest.id === currSuggestId
      );
      if (newTag)
        dispatch({
          type: "UPDATE",
          payload: {
            suggestions: [],
            currSuggestId: 0,
          },
        });
    } else if (key === "ArrowDown") {
      if (suggestions.length === 0) return;
      let currSuggestIndex =
        suggestions.findIndex((suggest) => suggest.id === currSuggestId) + 1;
      if (currSuggestIndex === suggestions.length) currSuggestIndex = 0;
      const newCurrSuggestId = suggestions[currSuggestIndex].id;
      if (listRef.current) {
        const currentList = [...listRef.current.children] as HTMLLIElement[];
        currentList.forEach((li) => {
          if (li.value === newCurrSuggestId)
            li.scrollIntoView({ block: "nearest" });
        });
      }
      dispatch({
        type: "UPDATE",
        payload: { currSuggestId: newCurrSuggestId },
      });
    } else if (key === "ArrowUp") {
      if (suggestions.length === 0) return;
      let currSuggestIndex =
        suggestions.findIndex((suggest) => suggest.id === currSuggestId) - 1;
      if (currSuggestIndex < 0) currSuggestIndex = suggestions.length - 1;
      const newCurrSuggestId = suggestions[currSuggestIndex].id;
      if (listRef.current) {
        const currentList = [...listRef.current.children] as HTMLLIElement[];
        currentList.forEach((li) => {
          if (li.value === newCurrSuggestId)
            li.scrollIntoView({ block: "nearest" });
        });
      }
      dispatch({
        type: "UPDATE",
        payload: { currSuggestId: newCurrSuggestId },
      });
    }
  };

  return {
    suggestions,
    currSuggestId,
    handleChange,
    handleKeyEnter,
    handleKeyArrow,
  };
};
