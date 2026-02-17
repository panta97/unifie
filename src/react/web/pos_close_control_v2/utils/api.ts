import type {
  Employee,
  POSState,
  SnapshotHistoryResponse,
  OTPVerifyResponse,
  OTPValidateResponse,
} from "../types";

const OTP_TOKEN_KEY = "otp_token";

/**
 * Get auth headers with OTP token from sessionStorage
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = sessionStorage.getItem(OTP_TOKEN_KEY);
  if (token) {
    headers["X-OTP-Token"] = token;
  }
  return headers;
}

/**
 * Check response for OTP session expiry (401 with otp_required)
 */
async function handleOTPExpiry(response: Response): Promise<void> {
  if (response.status === 401) {
    try {
      const data = await response.clone().json();
      if (data.otp_required) {
        window.dispatchEvent(new CustomEvent("otp-session-expired"));
      }
    } catch {
      // Ignore parse errors
    }
  }
}

/**
 * Verify OTP code for a manager
 */
export async function verifyOTP(
  employeeId: number,
  otpCode: string
): Promise<OTPVerifyResponse> {
  const response = await fetch("/api/pos-close-control/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_id: employeeId, otp_code: otpCode }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "OTP verification failed");
  }

  return response.json();
}

/**
 * Validate an existing OTP session token
 */
export async function validateSession(
  token: string
): Promise<OTPValidateResponse> {
  const response = await fetch("/api/pos-close-control/otp/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-OTP-Token": token,
    },
  });

  return response.json();
}

/**
 * API response structure from backend GET endpoint
 */
interface SessionDataResponse {
  statusCode: number;
  body: {
    pos_name: string;
    session_id: number;
    config_id: number;
    config_display_name: string;
    session_name: string;
    balance_start: number; // in cents
    start_at: string;
    stop_at: string;
    cash: number; // in cents
    card: number; // in cents
    credit_note: number; // in cents
    discounts: any[];
    is_session_closed: boolean;
    snapshot_count?: number; // Number of snapshots for this session
    saved_session?: {
      id: number;
      cashier?: { id: number };
      manager?: { id: number };
      observations: string;
      cash_denominations: any;
      card_amounts: any;
      pos_cash: number;
      pos_card: number;
      status?: string; // Session status (DRAFT/CLOSED)
    };
  };
}

/**
 * Fetch POS session data from backend
 */
export async function fetchSessionData(sessionId: number) {
  const response = await fetch(`/api/pos-close-control/v2/${sessionId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  await handleOTPExpiry(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch session data: ${response.statusText}`);
  }

  const data: SessionDataResponse = await response.json();

  // Transform backend response to frontend format
  return {
    sessionId: data.body.session_id,
    configId: data.body.config_id,
    configDisplayName: data.body.config_display_name,
    sessionName: data.body.session_name,
    posName: data.body.pos_name,
    startAt: data.body.start_at,
    stopAt: data.body.stop_at,
    isSessionClosed: data.body.is_session_closed,
    balanceStart: data.body.balance_start,
    odooCash: data.body.cash,
    odooCard: data.body.card,
    odooCreditNote: data.body.credit_note,
    posCash: 0, // Will be calculated from denominations
    posCard: 0, // Will be calculated from card amounts
    profitTotal: 0,
    balanceStartNextDay: 0,
    savedSession: data.body.saved_session, // Include saved session if exists
    snapshotCount: data.body.snapshot_count || 0, // Include snapshot count
  };
}

/**
 * Fetch employees (cashiers or managers) from backend
 */
export async function fetchEmployees(
  type: "cashier" | "manager"
): Promise<Employee[]> {
  // Map to backend Employee type constants
  const typeMapping = {
    cashier: "CA",
    manager: "MN",
  };

  const response = await fetch(
    `/api/pos-close-control/employee/${typeMapping[type]}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${type}s: ${response.statusText}`);
  }

  const data: Employee[] = await response.json();
  return data;
}

/**
 * Fetch snapshot history for a POS session
 */
export async function fetchSessionSnapshots(
  sessionId: number
): Promise<SnapshotHistoryResponse> {
  const response = await fetch(
    `/api/pos-close-control/v2/${sessionId}/snapshots`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  await handleOTPExpiry(response);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch session snapshots: ${response.statusText}`
    );
  }

  const data: SnapshotHistoryResponse = await response.json();
  return data;
}

/**
 * Autosave partial POS close control data (cash denominations and card amounts only)
 */
export async function autosavePosCloseControl(
  sessionId: number,
  cashDenominations: any,
  cardAmounts: any
) {
  const response = await fetch(`/api/pos-close-control/v2/${sessionId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      cashDenominations,
      cardAmounts,
    }),
  });

  await handleOTPExpiry(response);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
      `Failed to autosave POS close control: ${response.statusText}`
    );
  }

  const result = await response.json();
  return result;
}

/**
 * Submit POS close control data to backend
 */
export async function submitPosCloseControl(sessionId: number, data: POSState) {
  const response = await fetch(`/api/pos-close-control/v2/${sessionId}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      posName: data.summary.posName,
      cashier: {
        id: data.cashier?.id,
      },
      manager: {
        id: data.manager?.id,
      },
      summary: {
        sessionId: data.summary.sessionId,
        configId: data.summary.configId,
        sessionName: data.summary.sessionName,
        startAt: data.summary.startAt,
        stopAt: data.summary.stopAt,
        odooCash: data.summary.odooCash,
        odooCard: data.summary.odooCard,
        posCash: data.summary.posCash,
        posCard: data.summary.posCard,
        profitTotal: data.summary.profitTotal,
        balanceStart: data.summary.balanceStart,
        balanceStartNextDay: data.summary.balanceStartNextDay,
      },
      endState: {
        state: data.endState.state,
        amount: data.endState.amount,
        note: data.endState.note,
      },
      cashDenominations: data.cashDenominations,
      cardAmounts: data.cardAmounts,
    }),
  });

  await handleOTPExpiry(response);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
      `Failed to save POS close control: ${response.statusText}`
    );
  }

  const result = await response.json();
  return result;
}

/**
 * Update existing POS close control data in backend
 */
export async function updatePosCloseControl(sessionId: number, data: POSState) {
  const response = await fetch(`/api/pos-close-control/v2/${sessionId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      posName: data.summary.posName,
      cashier: {
        id: data.cashier?.id,
      },
      manager: {
        id: data.manager?.id,
      },
      summary: {
        sessionId: data.summary.sessionId,
        configId: data.summary.configId,
        sessionName: data.summary.sessionName,
        startAt: data.summary.startAt,
        stopAt: data.summary.stopAt,
        odooCash: data.summary.odooCash,
        odooCard: data.summary.odooCard,
        posCash: data.summary.posCash,
        posCard: data.summary.posCard,
        profitTotal: data.summary.profitTotal,
        balanceStart: data.summary.balanceStart,
        balanceStartNextDay: data.summary.balanceStartNextDay,
      },
      endState: {
        state: data.endState.state,
        amount: data.endState.amount,
        note: data.endState.note,
      },
      cashDenominations: data.cashDenominations,
      cardAmounts: data.cardAmounts,
    }),
  });

  await handleOTPExpiry(response);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
      `Failed to update POS close control: ${response.statusText}`
    );
  }

  const result = await response.json();
  return result;
}
