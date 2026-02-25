/// <reference lib="webworker" />

/**
 * Balance Calculator Web Worker
 *
 * Runs off the main thread to find all possible ways to compose a target cash
 * amount from available bill/coin denominations. This is a combinatorial search
 * problem (subset-sum variant) solved via backtracking.
 *
 * How it works:
 * 1. The UI sends a message with the available denominations (each with a max
 *    quantity the cashier has) and the target amount to reach.
 * 2. `findCandidates` uses depth-first backtracking: for each denomination it
 *    tries every possible quantity (from max down to 0) and recurses into the
 *    next denomination, pruning branches that overshoot or can't possibly reach
 *    the target.
 * 3. Each valid combination is scored using BALANCE_POINTS — smaller
 *    denominations score higher so the algorithm prefers giving change in coins
 *    first (easier for cashiers to manage).
 * 4. Results are sorted best-score-first and sent back to the UI.
 */

import type {
  DenominationInput,
  BalanceCandidate,
  WorkerRequest,
  WorkerResponse,
} from "./balanceCalculator.types";

// Scoring weights per denomination. Smaller denominations get higher points so
// candidates that use more coins are ranked first — this matches the business
// preference of balancing tills with smaller denominations when possible.
const BALANCE_POINTS: Record<string, number> = {
  "0.1": 1000,
  "0.2": 500,
  "0.5": 200,
  "1": 100,
  "2": 50,
  "5": 20,
  "10": 10,
  "20": 5,
  "50": 2,
  "100": 1,
  "200": 1,
};

// Cap the number of results to avoid excessive memory usage / long compute.
const MAX_CANDIDATES = 500;

/**
 * Quick feasibility check: can the remaining amount be exactly filled by any
 * single remaining denomination? This is a lightweight heuristic (not
 * exhaustive) used to prune obviously dead branches early and speed up the
 * search. Integer arithmetic (cents) avoids floating-point rounding issues.
 */
function canReachTarget(
  denominations: DenominationInput[],
  level: number,
  accumulatedAmount: number,
  targetAmount: number
): boolean {
  const remainingAmount = targetAmount - accumulatedAmount;
  const remainingInt = Math.round(remainingAmount * 100);

  for (let i = level; i < denominations.length; i++) {
    if (denominations[i].qty <= 0) continue;
    const denomInt = Math.round(denominations[i].denom * 100);
    if (remainingInt % denomInt === 0) {
      return true;
    }
  }

  return false;
}

/**
 * Main search: finds all denomination combinations that sum to `targetAmount`.
 *
 * Uses depth-first backtracking where each "level" corresponds to one
 * denomination. At each level we try every quantity from max down to 0,
 * pruning when the accumulated total overshoots or the `canReachTarget`
 * heuristic says the branch is infeasible. Valid combinations are collected
 * and sorted by score (highest first = more small denominations).
 */
function findCandidates(
  denominations: DenominationInput[],
  targetAmount: number
): BalanceCandidate[] {
  const results: BalanceCandidate[] = [];

  function recurse(
    level: number,
    accAmount: number,
    amounts: { denom: number; qty: number }[],
    score: number
  ) {
    if (results.length >= MAX_CANDIDATES) return;

    // Base case: all denominations have been considered.
    if (level >= denominations.length) {
      // Accept only exact matches (compared in cents to avoid float errors).
      if (Math.round(accAmount * 100) === Math.round(targetAmount * 100)) {
        results.push({
          amounts: [...amounts],
          score,
          accumulatedAmount: accAmount,
        });
      }
      return;
    }

    const { denom, qty: maxQty } = denominations[level];
    // Try from max quantity down to 0 — this way higher-quantity (and thus
    // higher-scoring) combinations are found first.
    let qty = maxQty;

    while (qty >= 0) {
      if (results.length >= MAX_CANDIDATES) return;

      const accumulated = accAmount + denom * qty;

      // Prune: skip if we've already exceeded the target.
      if (accumulated > targetAmount + 0.001) {
        qty--;
        continue;
      }

      // Prune: skip if no remaining denomination can fill the gap exactly
      // (unless we already hit the target).
      if (!canReachTarget(denominations, level + 1, accumulated, targetAmount) &&
          Math.round(accumulated * 100) !== Math.round(targetAmount * 100)) {
        qty--;
        continue;
      }

      // Accumulate score for this denomination choice.
      const denomKey = String(denom);
      const newScore = score + (BALANCE_POINTS[denomKey] ?? 0) * qty;

      recurse(
        level + 1,
        accumulated,
        [...amounts, { denom, qty }],
        newScore
      );

      qty--;
    }
  }

  recurse(0, 0, [], 0);

  // Best candidates (most small-denomination usage) first.
  results.sort((a, b) => b.score - a.score);
  return results;
}

// Entry point: receive denominations + target from the UI, compute, respond.
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { denominations, targetAmount } = e.data;
  const start = performance.now();

  const candidates = findCandidates(denominations, targetAmount);

  const computeTimeMs = performance.now() - start;

  const response: WorkerResponse = {
    candidates,
    totalFound: candidates.length,
    computeTimeMs,
  };

  self.postMessage(response);
};
