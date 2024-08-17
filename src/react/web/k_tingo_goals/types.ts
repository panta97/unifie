export enum StoreSectionEnum {
  ACCESSORIES = "ACCESSORIES",
  MEN = "MEN",
  WOMEN = "WOMEN",
  SPORTS = "SPORTS",
  HOME = "HOME",
  CHILDREN = "CHILDREN",
}

export type StoreSectionAmountObj = Record<StoreSectionEnum, number>;

export interface StoreResponse {
  selected_day: StoreSectionAmountObj;
  cumulative: StoreSectionAmountObj;
  global_goal: number;
}
