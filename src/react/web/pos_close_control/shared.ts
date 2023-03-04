import { DateTime } from "luxon";
import { endStateType } from "./app/slice/pos/posType";

export const getStateMessage = (diffAmount: number) => {
  if (diffAmount === 0) return "-";
  else if (diffAmount < 0) return "FALTANTE";
  else return "SOBRANTE";
};

export const getOdooStateMessage = (diffAmount: number) => {
  if (diffAmount === 0) return "";
  else if (diffAmount < 0) return "Salida";
  else return "Entrada";
};

export const getDateFormat = (sqlDate: string) => {
  const minutes = new Date().getTimezoneOffset();
  return DateTime.fromSQL(sqlDate)
    .minus({ minutes })
    .setLocale("es")
    .toFormat("cccc dd 'de' LLLL HH:mm");
};

export const getEndStateSpanish = (endState: endStateType) => {
  switch (endState) {
    case "extra":
      return "sobrante";
    case "stable":
      return "estable";
    case "missing":
      return "faltante";
  }
};
