export const FIXED_BALANCE_START = 30000; // Fixed starting balance in cents (300.00)

export interface CashDenominations {
  d0_10: number; // 0.10
  d0_20: number; // 0.20
  d0_50: number; // 0.50
  d1_00: number; // 1.00
  d2_00: number; // 2.00
  d5_00: number; // 5.00
  d10_00: number; // 10.00
  d20_00: number; // 20.00
  d50_00: number; // 50.00
  d100_00: number; // 100.00
  d200_00: number; // 200.00
}

export interface CardAmounts {
  pos1: number;
  pos2: number;
  miscellaneous: number;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

export interface Summary {
  sessionId: number;
  configId: number;
  configDisplayName: string;
  sessionName: string;
  posName: string;
  startAt: string;
  stopAt: string;
  isSessionClosed: boolean;
  balanceStart: number; // in cents
  odooCash: number; // in cents
  odooCard: number; // in cents
  odooCreditNote: number; // in cents
  posCash: number; // in cents (calculated from denominations)
  posCard: number; // in cents (calculated from card amounts)
  profitTotal: number; // in cents
  balanceStartNextDay: number; // in cents
}

export interface EndState {
  state: "stable" | "extra" | "missing";
  amount: number; // in cents
  note: string;
}

export interface POSState {
  summary: Summary;
  cashDenominations: CashDenominations;
  cardAmounts: CardAmounts;
  endState: EndState;
  cashier: Employee | null;
  manager: Employee | null;
}

// Snapshot-related types
export type SessionStatus = "DRAFT" | "CLOSED";

export interface Snapshot {
  id: number;
  version: number;
  snapshot_created_at: string;
  pos_name: string;
  status: SessionStatus;
  cashier: string | null;
  manager: string | null;
}

export interface SnapshotHistoryResponse {
  session_id: number;
  snapshot_count: number;
  snapshots: Snapshot[];
}

// OTP types
export interface OTPVerifyResponse {
  token: string;
  employee: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface OTPValidateResponse {
  valid: boolean;
  reason?: string;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}
