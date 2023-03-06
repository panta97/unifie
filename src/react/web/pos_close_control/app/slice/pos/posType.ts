import { Employee } from "../employee/employeeType";

export interface POSState {
  posName: string;
  cashier: Employee;
  manager: Employee;
  summary: POSSummary;
  endState: POSEndState;
  cashDenominations: CashDenominations;
  cardDenominations: CardDenominations;
  discounts: Discount[];
  fetchPOSStateStatus: fetchStatus;
  savePOSStateStatus: fetchStatus;
  isPOSStateSaved: boolean;
}

export interface POSSummary {
  balanceStart: number;
  balanceStartNextDay: number;
  odooCash: number;
  odooCard: number;
  posCash: number;
  posCard: number;
  profitTotal: number;
  sessionId: number;
  sessionName: string;
  startAt: string;
  stopAt: string;
  isSessionClosed: boolean;
}

export interface POSEndState {
  state: endStateType;
  amount: number;
  note: string;
}

export interface CashDenominations {
  d0_10: number;
  d0_20: number;
  d0_50: number;
  d1_00: number;
  d2_00: number;
  d5_00: number;
  d10_00: number;
  d20_00: number;
  d50_00: number;
  d100_00: number;
  d200_00: number;
  dolar: number;
}

export enum ECashDenom {
  d0_10,
  d0_20,
  d0_50,
  d1_00,
  d2_00,
  d5_00,
  d10_00,
  d20_00,
  d50_00,
  d100_00,
  d200_00,
}

export interface CardDenominations {
  pos1: number;
  pos2: number;
  miscellaneous: number;
}

export enum ECardDenom {
  pos1,
  pos2,
  miscellaneous,
}

export interface Discount {
  invoiceNumber: string;
  invoiceId: number;
  productDesc: string;
  discount: number;
  odooLink: string;
}

export interface POSFetchResult {
  pos_name: string;
  session_id: number;
  session_name: string;
  balance_start: number;
  start_at: string;
  stop_at: string;
  cash: number;
  card: number;
  discounts: DiscountResult[];
  is_session_closed: boolean;
}

export interface POSSaveResult {
  msg: string;
}

export interface DiscountResult {
  invoice_number: string;
  invoice_id: number;
  product_desc: string;
  discount: number;
  odoo_link: string;
}

export type endStateType = "extra" | "stable" | "missing";

export type fetchStatus = "idle" | "loading";
