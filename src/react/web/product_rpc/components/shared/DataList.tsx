import React, { forwardRef } from "react";
import { createPortal } from "react-dom";
import { TagData } from "../../types/tag";

interface DataListProps {
  suggestions: TagData[];
  currSuggestId: number;
  setTag: (tag: TagData) => void;
  rect?: DOMRect;
  style?: React.CSSProperties;
}

export const DataList = forwardRef<HTMLUListElement, DataListProps>(
  ({ suggestions, currSuggestId, setTag, rect, style }, ref) => {
    return createPortal(
      <ul
        ref={ref}
        className="text-sm cursor-pointer absolute rounded-md shadow bg-gray-100 overflow-y-scroll"
        style={{
          maxHeight: "260px",
          top: `${rect ? rect.top + rect.height + window.scrollY : rect}px`,
          left: `${rect?.left}px`,
          width: `${rect?.width}px`,
          ...style,
        }}
      >
        {suggestions.map((suggest) => (
          <li
            value={suggest.id}
            className={`px-0.5 hover:bg-gray-200 whitespace-pre-wrap ${
              currSuggestId === suggest.id ? "bg-gray-200" : ""
            }`}
            key={suggest.id}
            onClick={() => setTag(suggest)}
          >
            {suggest.name}
          </li>
        ))}
      </ul>,
      document.getElementById("portal")!
    );
  }
);
