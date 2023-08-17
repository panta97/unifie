import React, { useEffect } from "react";
import { Svg } from "../Svg";
import {
  DatePickeReducerAction,
  datePickerReducer,
  DatePickerReducerState,
  days,
  initState,
  months,
} from "./datePickerReducer";

interface DatePickerProps {
  name: string;
  value?: string;
  updateDate: (newDate: string) => void;
}

export const DatePicker = ({ name, value, updateDate }: DatePickerProps) => {
  const [state, dispatch] = React.useReducer<
    React.Reducer<DatePickerReducerState, DatePickeReducerAction>
  >(datePickerReducer, initState);
  const displayDateRef =
    React.useRef<HTMLInputElement>() as React.MutableRefObject<HTMLInputElement>;
  const daysDivRef =
    React.useRef<HTMLDivElement>() as React.MutableRefObject<HTMLDivElement>;

  useEffect(() => {
    dispatch({ type: "SET_INIT_STATE" });
  }, []);

  useEffect(() => {
    updateDate(state.date);
    // we used to have updateDate function in the array below
    // but was causing infinite renders
  }, [state.date]);

  const toggleDisplayDateFocus = (): void => {
    /**
     * This functions triggers when the user clicks:
     * 1. The input element
     * 2. The input element goes out of focus
     * 3. A day in the calendar
     *
     * When the calendar input contains shadow-outline class it means it's focus,
     * so we remove that class and trigger blur programatically.
     * On the other hand if the input doesn't have the class, it means it's not focused,
     * so we trigger the focus and add the class.
     */
    const displayDate = displayDateRef.current!;
    if (displayDate.classList.contains("shadow-outline")) {
      displayDate.classList.remove("shadow-outline");
      displayDate.blur();
    } else {
      displayDate.classList.add("shadow-outline");
      displayDate.focus();
    }

    const daysDiv = daysDivRef.current!;
    daysDiv.focus();
  };

  return (
    <div className="text-sm text-gray-800">
      <div className="relative">
        <input
          id={name}
          type="text"
          readOnly
          value={state.displayDate}
          ref={displayDateRef}
          onClick={() => {
            dispatch({ type: "IS_OPEN", isOpen: !state.isOpen });
            toggleDisplayDateFocus();
          }}
          onBlur={() => {
            dispatch({ type: "IS_OPEN", isOpen: false });
            toggleDisplayDateFocus();
          }}
          className="border border-gray-300 w-full px-2 rounded shadow-sm appearance-none cursor-pointer"
          placeholder="Select date"
        />

        <div
          onClick={() => {
            dispatch({ type: "IS_OPEN", isOpen: !state.isOpen });
            toggleDisplayDateFocus();
          }}
          className="absolute top-0 right-0 pr-2 cursor-pointer"
        >
          <Svg.Calendar className="h-5 w-5" />
        </div>

        <div
          className={`focus:outline-none outline-none duration-200 mt-6 bg-gray-100 rounded-md shadow p-3 absolute top-0 left-0 ${
            !state.isOpen ? "invisible opacity-0" : "visible opacity-100"
          }`}
          style={{ width: "245px" }}
          ref={daysDivRef}
          tabIndex={-1}
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-lg font-bold text-gray-800">
                {months[state.month]}
              </span>
              <span className="ml-1 text-lg text-gray-800 font-normal">
                {state.year}
              </span>
            </div>
            <div>
              <button
                type="button"
                className={`transition ease-in-out duration-100 inline-flex cursor-pointer hover:bg-gray-200 p-1 rounded-full focus:shadow-outline focus:outline-none mr-1`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => dispatch({ type: "SUBTRACT_MONTH" })}
              >
                <Svg.ChevronLeft className="h-5 w-5 text-gray-700 inline-flex" />
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                className={`transition ease-in-out duration-100 inline-flex cursor-pointer hover:bg-gray-200 p-1 rounded-full focus:shadow-outline focus:outline-none`}
                onClick={() => dispatch({ type: "ADD_MONTH" })}
              >
                <Svg.ChevronRight className="h-5 w-5 text-gray-700 inline-flex" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap mb-2 -mx-1">
            {days.map((day, index) => (
              <div key={index} style={{ width: "32px" }} className="px-1">
                <div className="text-gray-800 font-medium text-center text-xs">
                  {day}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap -mx-1">
            {state.blankDaysArr.map((day) => (
              <div
                key={day}
                style={{ width: "32px" }}
                className="text-center border p-1 border-transparent text-xs"
              />
            ))}
            {state.daysInMonthArr.map((date, index) => (
              <div key={index} style={{ width: "32px" }} className="px-1 mb-1">
                <div
                  onClick={() => {
                    dispatch({ type: "SET_DATE", dayNumber: date.day });
                    toggleDisplayDateFocus();
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  className={`cursor-pointer text-center text-xs rounded-full leading-loose ${
                    date.toString === state.date
                      ? "bg-emerald-400 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {date.day}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
