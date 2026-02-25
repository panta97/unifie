export interface DenominationInput {
  denom: number;
  qty: number;
}

export interface BalanceCandidate {
  amounts: { denom: number; qty: number }[];
  score: number;
  accumulatedAmount: number;
}

export interface WorkerRequest {
  denominations: DenominationInput[];
  targetAmount: number;
}

export interface WorkerResponse {
  candidates: BalanceCandidate[];
  totalFound: number;
  computeTimeMs: number;
}
