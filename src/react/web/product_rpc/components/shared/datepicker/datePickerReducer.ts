import React from "react";
interface SpanishMonth {
  name: string;
  shortName: string;
  spanishCalendarMonthNumber: number;
}

export type DateObj = {
  day: number;
  toString: string;
};

export interface DatePickerReducerState {
  isOpen: boolean;
  date: string;
  displayDate: string;
  selectedDay: number;
  month: number;
  year: number;
  daysInMonthArr: DateObj[];
  blankDaysArr: number[];
}

export const months: { [id: number]: string } = {
  0: "Enero",
  1: "Febrero",
  2: "Marzo",
  3: "Abril",
  4: "Mayo",
  5: "Junio",
  6: "Julio",
  7: "Agosto",
  8: "Septiembre",
  9: "Octubre",
  10: "Noviembre",
  11: "Diciembre",
};

const spanishMonths: { [id: number]: SpanishMonth } = {
  0: {
    name: "Enero",
    shortName: "Ene",
    spanishCalendarMonthNumber: 1,
  },
  1: {
    name: "Febrero",
    shortName: "Feb",
    spanishCalendarMonthNumber: 2,
  },
  2: {
    name: "Marzo",
    shortName: "Mar",
    spanishCalendarMonthNumber: 3,
  },
  3: {
    name: "Abril",
    shortName: "Abr",
    spanishCalendarMonthNumber: 4,
  },
  4: {
    name: "Mayo",
    shortName: "May",
    spanishCalendarMonthNumber: 5,
  },
  5: {
    name: "Junio",
    shortName: "Jun",
    spanishCalendarMonthNumber: 6,
  },
  6: {
    name: "Julio",
    shortName: "Jul",
    spanishCalendarMonthNumber: 7,
  },
  7: {
    name: "Agosto",
    shortName: "Ago",
    spanishCalendarMonthNumber: 8,
  },
  8: {
    name: "Septiembre",
    shortName: "Sep",
    spanishCalendarMonthNumber: 9,
  },
  9: {
    name: "Octubre",
    shortName: "Oct",
    spanishCalendarMonthNumber: 10,
  },
  10: {
    name: "Noviembre",
    shortName: "Nov",
    spanishCalendarMonthNumber: 11,
  },
  11: {
    name: "Diciembre",
    shortName: "Dic",
    spanishCalendarMonthNumber: 12,
  },
};

interface SpanishCalendarDay {
  name: string;
  shortName: string;
  spanishCalendarWeekdayNumber: number;
}

const spanishDays: { [id: number]: SpanishCalendarDay } = {
  0: {
    name: "Domingo",
    shortName: "Dom",
    spanishCalendarWeekdayNumber: 6,
  },
  1: {
    name: "Lunes",
    shortName: "Lun",
    spanishCalendarWeekdayNumber: 0,
  },
  2: {
    name: "Martes",
    shortName: "Mar",
    spanishCalendarWeekdayNumber: 1,
  },
  3: {
    name: "Miércoles",
    shortName: "Mie",
    spanishCalendarWeekdayNumber: 2,
  },
  4: {
    name: "Jueves",
    shortName: "Jue",
    spanishCalendarWeekdayNumber: 3,
  },
  5: {
    name: "Viernes",
    shortName: "Vie",
    spanishCalendarWeekdayNumber: 4,
  },
  6: {
    name: "Sábado",
    shortName: "Sab",
    spanishCalendarWeekdayNumber: 5,
  },
};

export const days = ["Lun", "Mar", "Mier", "Jue", "Vie", "Sab", "Dom"];

export type DatePickeReducerAction =
  | { type: "SET_INIT_STATE"; initialDate?: string }
  | { type: "IS_OPEN"; isOpen: boolean }
  | { type: "SET_DATE"; dayNumber: number }
  | { type: "ADD_MONTH" }
  | { type: "SUBTRACT_MONTH" };

export const initState: DatePickerReducerState = {
  isOpen: false,
  date: "",
  displayDate: "",
  selectedDay: 0,
  month: 0,
  year: 0,
  daysInMonthArr: [],
  blankDaysArr: [],
};

export const datePickerReducer: React.Reducer<
  DatePickerReducerState,
  DatePickeReducerAction
> = (state, action) => {
  switch (action.type) {
    case "SET_INIT_STATE": {
      let initialDate: Date;
      if (action.initialDate) {
        const [year, month, day] = action.initialDate
          .split("-")
          .map((part) => Number(part));
        initialDate = new Date(year, month - 1, day);
      } else initialDate = new Date();

      const month = initialDate.getMonth();
      const year = initialDate.getFullYear();
      const dayOfWeek = new Date(year, month).getDay();
      const spanishWeekday =
        spanishDays[dayOfWeek].spanishCalendarWeekdayNumber;
      const displayDate = getSQLDate(
        new Date(year, month, initialDate.getDate())
      );
      const selectedDay = initialDate.getDate();
      const date = formatYearsMonthDay(
        new Date(year, month, initialDate.getDate())
      );

      // Get last day number of the previous actual month
      const daysInMonth = new Date(year, month, 0).getDate();

      // Get the number (0-6) on which the actual month starts
      let blankDaysArr: number[] = [];
      for (let i = 1; i <= spanishWeekday; i++) {
        blankDaysArr.push(i);
      }

      let daysInMonthArr: DateObj[] = [];
      for (let i = 1; i < daysInMonth; i++) {
        daysInMonthArr.push({
          day: i,
          toString: `${year}-${String(month + 1).padStart(2, "0")}-${String(
            i
          ).padStart(2, "0")}`,
        });
      }

      return {
        ...state,
        date,
        displayDate,
        selectedDay,
        month,
        year,
        daysInMonthArr,
        blankDaysArr,
      };
    }

    case "IS_OPEN": {
      return {
        ...state,
        isOpen: action.isOpen,
      };
    }

    case "SET_DATE": {
      const dateToFormat = new Date(state.year, state.month, action.dayNumber);
      const date = formatYearsMonthDay(dateToFormat);
      const displayDate = getSQLDate(dateToFormat);
      const selectedDay = action.dayNumber;

      return {
        ...state,
        date,
        displayDate,
        selectedDay,
        isOpen: false,
      };
    }

    case "ADD_MONTH": {
      let newYear: number;
      let newMonth: number;
      if (state.month === 11) {
        newMonth = 0;
        newYear = state.year + 1;
      } else {
        newMonth = state.month + 1;
        newYear = state.year;
      }

      const newMonthFirstWeekdayNumber = new Date(
        newYear,
        newMonth,
        1
      ).getDay();
      const spanishFirstWeekdayNumber =
        spanishDays[newMonthFirstWeekdayNumber].spanishCalendarWeekdayNumber;
      const daysInMonth = new Date(newYear, newMonth + 1, 0).getDate();

      let blankDaysArr = [];
      for (let i = 1; i <= spanishFirstWeekdayNumber; i++) {
        blankDaysArr.push(i);
      }

      let daysInMonthArr: DateObj[] = [];
      for (let i = 1; i <= daysInMonth; i++) {
        daysInMonthArr.push({
          day: i,
          toString: `${newYear}-${String(newMonth + 1).padStart(
            2,
            "0"
          )}-${String(i).padStart(2, "0")}`,
        });
      }

      return {
        ...state,
        month: newMonth,
        year: newYear,
        daysInMonthArr,
        blankDaysArr,
      };
    }

    case "SUBTRACT_MONTH": {
      let newYear: number;
      let newMonth: number;
      if (state.month === 0) {
        newMonth = 11;
        newYear = state.year - 1;
      } else {
        newMonth = state.month - 1;
        newYear = state.year;
      }

      const newMonthFirstWeekdayNumber = new Date(
        newYear,
        newMonth,
        1
      ).getDay();
      const spanishFirstWeekdayNumber =
        spanishDays[newMonthFirstWeekdayNumber].spanishCalendarWeekdayNumber;
      const daysInMonth = new Date(newYear, newMonth + 1, 0).getDate();

      let blankDaysArr = [];
      for (let i = 1; i <= spanishFirstWeekdayNumber; i++) {
        blankDaysArr.push(i);
      }

      let daysInMonthArr: DateObj[] = [];
      for (let i = 1; i <= daysInMonth; i++) {
        daysInMonthArr.push({
          day: i,
          toString: `${newYear}-${String(newMonth + 1).padStart(
            2,
            "0"
          )}-${String(i).padStart(2, "0")}`,
        });
      }

      return {
        ...state,
        year: newYear,
        month: newMonth,
        daysInMonthArr,
        blankDaysArr,
      };
    }
  }
};

const getSpanishDate = (date: Date): string => {
  const year = date.getFullYear();
  const monthShortName = spanishMonths[date.getMonth()].shortName;
  const day = ("0" + date.getDate()).slice(-2);
  const dayShortName = spanishDays[date.getDay()].shortName;

  return `${dayShortName} ${day} ${monthShortName}, ${year}`;
};

const getSQLDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`;
};

const formatYearsMonthDay = (date: Date): string => {
  return (
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2)
  );
};
