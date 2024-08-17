export enum StoreSectionEnum {
  ACCESSORIES = "ACCESSORIES",
  MEN = "MEN",
  WOMEN = "WOMEN",
  SPORTS = "SPORTS",
  HOME = "HOME",
  CHILDREN = "CHILDREN",
  CLEARANCE = "CLEARANCE",
  MISCELLANEOUS = "MISCELLANEOUS",
}

export type StoreSectionAmountObj = Record<StoreSectionEnum, number>;

export interface StoreSectionGoalCumulative {
  section: StoreSectionEnum;
  manager: string;
  year: number;
  month: number;
  goal: number;
  amount: number;
}

export interface StoreSectionResponse {
  selected_day: StoreSectionAmountObj;
  cumulative: StoreSectionGoalCumulative[];
}
