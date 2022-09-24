export const getCurrencyFormat = (price: number) => {
  // price can be either string or number
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(price);
};

export const getTodayDate = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}-${day}`;
};

export const getSheetFilename = (headers: Headers): string => {
  const content = headers.get("Content-Disposition");
  // content should come in this form:
  // "attachment; filename=VENTAS_OLYMPO_2021-06-30_2021-06-30.xlsx"
  if (!content) throw new Error("Could not get filename at content");
  const filename = content.split(";")[1];
  if (!filename) throw new Error("Could not get filename at filename");
  const sheetname = filename.split("=")[1];
  return sheetname;
};

export const getDateDiff = (dateStrFrom: string, dateStrTo: string): number => {
  const [yearF, monthF, dayF] = dateStrFrom.split("-").map((e) => Number(e));
  const dateFrom = new Date(yearF, monthF - 1, dayF);
  const [yearT, monthT, dayT] = dateStrTo.split("-").map((e) => Number(e));
  const dateTo = new Date(yearT, monthT - 1, dayT);
  return dateTo.getTime() - dateFrom.getTime();
};

export const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};
