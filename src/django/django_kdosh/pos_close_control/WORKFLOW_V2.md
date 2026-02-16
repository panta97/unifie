# POS Close Control V2 - Workflow Documentation

## 1. Overview

POS Close Control V2 is a cash reconciliation tool that compares **Odoo POS expected amounts** (from payment records) against **physically counted cash and card totals** entered by store staff. It answers the question: *"Does the money in the register match what the system says should be there?"*

### Why V2?

V1 used `DecimalField` (`max_digits=12, decimal_places=2`) for all monetary values. V2 switches to **integer cents** (`IntegerField`) to eliminate floating-point rounding errors. For example, S/. 123.45 is stored as `12345`.

Additional V2 features:
- **Autosave** - Partial data (denominations and card amounts) is saved automatically via debounced PATCH requests, so work isn't lost if the browser closes.
- **Snapshots** - When a CLOSED session is updated, the previous state is preserved as a `PosSessionV2Snapshot` before overwriting, creating an audit trail.
- **Session status** - Sessions now have a `DRAFT`/`CLOSED` lifecycle instead of being one-shot inserts.
- **Nullable cashier/manager** - These can be null during autosave (before the user selects employees).

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React SPA (pos_close_control_v2)                 │  │
│  │  - App.tsx (state orchestrator)                   │  │
│  │  - Header / LeftSection / RightSection            │  │
│  │  - SummaryPrint (thermal printer portal)          │  │
│  │  - useAutosave hook (2s debounce)                 │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     │ fetch() calls                      │
└─────────────────────┼───────────────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │  Django Backend            │
        │  pos_close_control app     │
        │  ┌──────────────────────┐  │
        │  │ PosCloseControlV2View│  │
        │  │ GET / POST / PUT /   │  │
        │  │ PATCH                │  │
        │  ├──────────────────────┤  │
        │  │ snapshot_views.py    │  │
        │  │ GET snapshots        │  │
        │  ├──────────────────────┤  │
        │  │ employee()           │  │
        │  │ GET employees        │  │
        │  └──────────┬───────────┘  │
        │             │              │
        │  ┌──────────▼───────────┐  │
        │  │  rpc.py              │  │
        │  │  XML-RPC proxy       │  │
        │  └──────────┬───────────┘  │
        └─────────────┼──────────────┘
                      │ XML-RPC
              ┌───────▼────────┐
              │  Odoo 17 ERP   │
              │  pos.session    │
              │  pos.payment    │
              │  account.bank.  │
              │  statement.line │
              └────────────────┘
```

### Request flow

1. User navigates to `/apps/pos-close-control/v2` (served by `react.views.pos_close_control_view_v2`, requires `@login_required`).
2. Django renders an HTML shell that loads the React SPA bundle (`pos_close_control_v2`).
3. React makes API calls to `/api/pos-close-control/...` endpoints.
4. The Django view fetches live data from Odoo via XML-RPC (`rpc.py`) and merges it with any locally-saved `PosSessionV2` record.

---

## 3. Data Models

### 3.1 Employee

| Field        | Type          | Notes                         |
|-------------|---------------|-------------------------------|
| `id`        | AutoField PK  |                               |
| `first_name`| CharField(100)|                               |
| `last_name` | CharField(100)|                               |
| `type`      | CharField(2)  | `"CA"` (Cashier) or `"MN"` (Manager) |
| `is_used`   | BooleanField  | Soft-delete flag (default `True`) |

### 3.2 PosSessionV2

All monetary fields are **integers in cents**.

| Field                    | Type            | Notes                                     |
|-------------------------|-----------------|-------------------------------------------|
| `id`                    | AutoField PK    |                                           |
| `pos_name`              | CharField(50)   | e.g. `"Tienda1"`                          |
| `cashier`               | FK → Employee   | Nullable (null during autosave)            |
| `manager`               | FK → Employee   | Nullable (null during autosave)            |
| `odoo_session_id`       | IntegerField    | Odoo `pos.session` ID                     |
| `odoo_config_id`        | IntegerField    | Odoo `pos.config` ID                      |
| `odoo_cash`             | IntegerField    | Expected cash from Odoo (cents)            |
| `odoo_card`             | IntegerField    | Expected card from Odoo (cents)            |
| `pos_cash`              | IntegerField    | Physically counted cash (cents)            |
| `pos_card`              | IntegerField    | Physically counted card (cents)            |
| `profit_total`          | IntegerField    | `pos_cash + pos_card - odoo_cash - odoo_card` |
| `balance_start`         | IntegerField    | Opening cash balance (cents)               |
| `balance_start_next_day`| IntegerField    | Next-day opening balance (default 0)       |
| `session_name`          | CharField(100)  | Odoo session display name                  |
| `start_at`              | DateTimeField   | Session open time from Odoo                |
| `stop_at`               | DateTimeField   | Session close time (nullable for autosave) |
| `end_state`             | CharField(10)   | `EXTRA`, `STABLE`, or `MISSING`            |
| `end_state_note`        | TextField       | Observations / explanation                 |
| `end_state_amount`      | IntegerField    | Absolute difference (cents)                |
| `json`                  | TextField       | Full JSON blob with denominations, card amounts, and save payload |
| `odoo_version`          | IntegerField    | Default `17`                               |
| `status`                | CharField(10)   | `DRAFT` or `CLOSED`                        |

### 3.3 PosSessionV2Snapshot

Created automatically when a **CLOSED** session is updated via PUT. Contains all the same fields as `PosSessionV2` plus:

| Extra Field              | Type            | Notes                                  |
|-------------------------|-----------------|----------------------------------------|
| `original_session_id`   | IntegerField    | References `odoo_session_id`           |
| `snapshot_created_at`   | DateTimeField   | Auto-set on creation (`auto_now_add`)  |

The snapshot is a complete copy of the session state at the moment before the update.

---

## 4. API Endpoints

All V2 API endpoints are under `/api/pos-close-control/`. URL patterns are defined in `pos_close_control/urls.py` and included at the root level in `django_kdosh/urls.py` via `path("", include("pos_close_control.urls"))`.

### 4.1 GET `/api/pos-close-control/v2/<session_id>`

**Purpose:** Fetch session data from Odoo and merge with any saved local session.

**Process:**
1. Queries Odoo `pos.session` via XML-RPC for session metadata.
2. Queries `account.bank.statement.line` for cash in/out adjustments.
3. Queries `pos.payment` and categorizes each payment by `payment_method_id`:
   - Cash method IDs: `{1,9,11,12,13,14,15,16,17,18,19,20,22,23,24,25,27,28}`
   - Card method IDs: `{2,4,6,31}`
   - Credit note method IDs: `{10,21,26}`
4. Calculates opening balance adjustment: `opening = cash_register_balance_end - cash`, then `cash += opening`.
5. Converts all float amounts to **integer cents** (`int(round(value * 100))`).
6. Checks for a saved `PosSessionV2` record by `odoo_session_id`:
   - If found: updates the record's `odoo_cash`, `odoo_card`, `start_at`, `stop_at` with fresh Odoo values, then returns the saved session data (denominations, card amounts, observations, employee selections, status) alongside the Odoo data.
   - Also returns `snapshot_count` for the session.

**Response:**
```json
{
  "statusCode": 200,
  "body": {
    "pos_name": "Tienda1",
    "session_id": 123,
    "config_id": 5,
    "config_display_name": "Tienda1 POS",
    "session_name": "POS/001",
    "balance_start": 20000,
    "start_at": "2025-01-15 08:00:00",
    "stop_at": "2025-01-15 18:00:00",
    "cash": 150000,
    "card": 80000,
    "credit_note": 5000,
    "discounts": [],
    "is_session_closed": true,
    "saved_session": {
      "id": 42,
      "observations": "Todo en orden",
      "cash_denominations": { "d0_10": 0, "d0_20": 5, ... },
      "card_amounts": { "pos1": 50000, "pos2": 30000, "miscellaneous": 0 },
      "pos_cash": 150000,
      "pos_card": 80000,
      "status": "CLOSED",
      "cashier": { "id": 1 },
      "manager": { "id": 3 }
    },
    "snapshot_count": 2
  }
}
```

### 4.2 POST `/api/pos-close-control/v2/<session_id>`

**Purpose:** Create a new POS session record (first-time save).

**Payload:** Full save payload from the frontend including `posName`, `cashier`, `manager`, `summary`, `endState`, `cashDenominations`, `cardAmounts`.

**Logic:**
- Validates cashier and manager exist and are active (`is_used=True`).
- Maps `endState.state` (`"extra"` → `"EX"`, `"stable"` → `"ST"`, `"missing"` → `"MS"`).
- Sets `status = CLOSED` if `stopAt` is present, `DRAFT` otherwise.
- Creates a new `PosSessionV2` record.

**Response:** `201 Created` with `{ "message": "Sesión guardada", "id": <pk> }`.

### 4.3 PUT `/api/pos-close-control/v2/<session_id>`

**Purpose:** Update an existing session. Creates a snapshot if the session is currently CLOSED.

**Snapshot logic:**
- If `saved_session.status == "CLOSED"`, a full copy of the current record is saved as a `PosSessionV2Snapshot` before applying the update.
- The session is then updated with new values from the request body.

**Response:** `200 OK` with `{ "message": "Sesión actualizada", "id": <pk>, "snapshot_created": true|false }`.

### 4.4 PATCH `/api/pos-close-control/v2/<session_id>`

**Purpose:** Autosave partial data (denominations and card amounts only).

**Payload:**
```json
{
  "cashDenominations": { "d0_10": 0, "d0_20": 5, ... },
  "cardAmounts": { "pos1": 50000, "pos2": 30000, "miscellaneous": 0 }
}
```

**Logic:**
- If a session exists: merges denomination/card data into the existing JSON, recalculates `pos_cash`, `pos_card`, and `profit_total`.
- If no session exists: fetches minimal Odoo data, creates a new `PosSessionV2` with placeholder values (`odoo_cash=0`, `odoo_card=0`, no cashier/manager, `status=DRAFT`).

**Response:** `200 OK` (updated) or `201 Created` (new) with `{ "message": "Autosave successful (...)", "id": <pk>, "created": true|false }`.

### 4.5 GET `/api/pos-close-control/v2/<session_id>/snapshots`

**Purpose:** Retrieve the snapshot history for a session.

**Response:**
```json
{
  "session_id": 123,
  "snapshot_count": 3,
  "snapshots": [
    {
      "id": 10,
      "version": 3,
      "snapshot_created_at": "2025-01-15T19:00:00Z",
      "pos_name": "Tienda1",
      "status": "CLOSED",
      "cashier": "Juan P.",
      "manager": "Maria G."
    }
  ]
}
```

Snapshots are ordered newest-first. `version` is calculated as a sequential number (1 = oldest).

### 4.6 GET `/api/pos-close-control/employee/<type>`

**Purpose:** Fetch active employees by type.

| Parameter | Values | Returns |
|----------|--------|---------|
| `type`   | `CA`   | Active cashiers (`id`, `first_name`, `last_name`) |
| `type`   | `MN`   | Active managers (`id`, `first_name`, `last_name`) |

---

## 5. Frontend Components

The React app is in `src/react/web/pos_close_control_v2/`.

### 5.1 `App.tsx` - Main Orchestrator

Manages all application state:
- `sessionId` / `summary` - Current Odoo session data
- `cashDenominations` - 11 denomination quantities (coins + bills)
- `cardAmounts` - POS1, POS2, miscellaneous card totals (in cents)
- `observations` - Free-text notes
- `selectedCashier` / `selectedManager` - Chosen employees
- `isExistingSession` - Whether a saved record exists (determines POST vs PUT)
- `snapshots` / `snapshotCount` - Snapshot history

**Key calculations (derived, not stored in state):**
```
posCash = sum(denomination_qty * denomination_value_in_cents)
posCard = pos1 + pos2 + miscellaneous
profitTotal = posCash + posCard - odooCash - odooCard
```

**Save flow (`handleSave`):**
1. Validates cashier, manager, and session are set.
2. Computes `difference = (posCash + posCard) - (odooCash + odooCard)`.
3. Determines `endState`: negative → `"missing"`, positive → `"extra"`, zero → `"stable"`.
4. Calls `submitPosCloseControl` (POST) for new sessions or `updatePosCloseControl` (PUT) for existing.
5. After success, re-fetches snapshot history and shows a success modal.

### 5.2 `Header.tsx`

Three-column layout spanning the full width:
- **Left:** Session ID input + "Buscar" button
- **Center:** Session name, config display name, and snapshot history dropdown (shows version history when clicked)
- **Right:** Open/close timestamps ("Apertura" / "Cierre"). Shows "Pendiente" in red if session is still open.

### 5.3 `LeftSection.tsx`

Two tables stacked vertically:

**EFECTIVO EN CAJA (Cash):**
- 11 rows for each denomination: S/. 0.10, 0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00, 200.00.
- Each row shows: denomination label | quantity input | calculated total.
- Total row at bottom sums all denomination totals.

**TARJETA (Card):**
- 3 rows: POS 1, POS 2, OTROS (miscellaneous).
- Input values displayed in soles (divided by 100 for display, multiplied by 100 on change).
- Total row at bottom.

All inputs are disabled when no session is loaded (`disabled={sessionId === 0}`).

### 5.4 `RightSection.tsx`

The summary and comparison panel:

**Bar Comparator:**
- Two horizontal stacked bars (ODOO vs CAJA), each split into cash (green) and card (blue) segments proportional to their amounts.
- A difference bar appears:
  - Amber "Sobrante" bar next to ODOO if `caja > odoo`.
  - Red "Faltante" bar next to CAJA if `odoo > caja`.
- Status box on the right: shows "Faltante" (red), "Estable" (green), or "Sobrante" (orange) with the absolute difference amount.

**Info Table:**
- Total Odoo, Total Caja, Nota de Credito, Inicio (balance start).

**Form Fields:**
- Supervisor dropdown (required, red border when empty)
- Cajero dropdown (required, red border when empty)
- Observaciones textarea (required only when status is "Faltante", red border when empty and required)

**Save Button:**
- Shows "GUARDAR" for new sessions, "ACTUALIZAR" for existing ones.
- Disabled (grayed out) when validation fails. Clicking while disabled shows a modal explaining all unmet conditions.

**Validation rules for save:**
1. Session must be closed (`isSessionClosed === true`)
2. Manager must be selected
3. Cashier must be selected
4. If difference < 0 (Faltante), observations must not be empty

### 5.5 `SummaryPrint.tsx`

A React portal that renders into a `#print` DOM element (outside the main app container). This content is visible only when printing (`window.print()`), styled for an 80mm thermal receipt printer (296px width).

**Print layout:**
- POS name and session name (header)
- Open/close dates (formatted in Spanish: "lunes 15 de enero 14:30")
- Cashier and Manager names
- Odoo card and cash totals
- Counted cash and card totals (posCash, posCard)
- Credit note total
- Signature lines for cashier and manager

If the session is not closed, it shows a message: "La sesión aún está abierta y no se puede imprimir."

### 5.6 `useAutosave.ts` Hook

Debounced autosave with the following behavior:
- **Debounce:** 2000ms (configurable via `debounceMs`).
- **Trigger:** Called whenever `cashDenominations` or `cardAmounts` change (via a `useEffect` in App).
- **Guard:** Only fires when `enabled` is true (i.e., a session is loaded) and prevents concurrent saves with a `saveInProgressRef`.
- **Status cycle:** `idle` → `saving` → `saved` (resets to `idle` after 2s) or `error` (resets to `idle` after 5s).
- **Silent failures:** Autosave errors are logged to console but not shown to the user.

### 5.7 `utils/api.ts` - API Functions

| Function                    | Method | Endpoint                                          |
|----------------------------|--------|----------------------------------------------------|
| `fetchSessionData`          | GET    | `/api/pos-close-control/v2/<sessionId>`            |
| `fetchEmployees`            | GET    | `/api/pos-close-control/employee/<CA\|MN>`         |
| `fetchSessionSnapshots`     | GET    | `/api/pos-close-control/v2/<sessionId>/snapshots`  |
| `autosavePosCloseControl`   | PATCH  | `/api/pos-close-control/v2/<sessionId>`            |
| `submitPosCloseControl`     | POST   | `/api/pos-close-control/v2/<sessionId>`            |
| `updatePosCloseControl`     | PUT    | `/api/pos-close-control/v2/<sessionId>`            |

### 5.8 `utils/formatters.ts`

| Function            | Input             | Output                          |
|--------------------|-------------------|---------------------------------|
| `toDisplay(cents)` | `1050`            | `10.50`                         |
| `toStorage(dec)`   | `10.50`           | `1050`                          |
| `formatCurrency`   | `1050`            | `"S/. 10.50"`                   |
| `formatDate`       | ISO string        | `"15/01/2024 14:30:00"`         |
| `formatDateForPrint` | ISO string      | `"lunes 15 de enero 14:30"`    |
| `getEndStateLabel` | `"missing"`       | `"Faltante"`                    |
| `getDifferenceLabel` | `-500`          | `"Faltante"`                    |

---

## 6. Complete User Workflow

### Step 1: Open the app
User navigates to `/apps/pos-close-control/v2`. Django verifies login (`@login_required`) and serves the React SPA. On mount, the app fetches all active cashiers and managers from `/api/pos-close-control/employee/CA` and `/api/pos-close-control/employee/MN`.

### Step 2: Load a session
User enters an Odoo session ID and clicks "Buscar". The app calls `GET /api/pos-close-control/v2/<id>`:
- Backend fetches live data from Odoo (cash, card, credit note, balance, timestamps).
- If a saved `PosSessionV2` exists for that session, the backend merges saved form data (denominations, card amounts, observations, employee selections) into the response.
- Snapshot history is also fetched.

### Step 3: Enter counted amounts
User fills in the **cash denominations** (quantity of each coin/bill) and **card amounts** (POS 1, POS 2, miscellaneous).
- Each change triggers the `useAutosave` hook, which debounces for 2 seconds then sends a PATCH to save partial data.
- If no `PosSessionV2` record exists yet, the first autosave creates one with placeholder values.

### Step 4: Review the comparison
The **RightSection** shows a real-time visual comparison:
- Bar chart comparing Odoo totals vs. physically counted totals.
- Status indicator: Estable (green) / Sobrante (orange) / Faltante (red).
- Summary table with all totals.

### Step 5: Select employees and add observations
- User selects a **Gerente** (manager) and **Cajero** (cashier) from dropdowns.
- If there's a shortage (Faltante), the observations field becomes required.

### Step 6: Save
User clicks "GUARDAR" (new) or "ACTUALIZAR" (existing):
- Validation checks run (session closed, employees selected, observations if required).
- If validation fails, a modal shows all unmet conditions.
- If valid:
  - **New session:** POST creates a `PosSessionV2` with status `CLOSED` (if Odoo session is closed).
  - **Existing session:** PUT updates the record. If it was already `CLOSED`, a snapshot is created first.
- After save, snapshot history is refreshed and a success modal appears.

### Step 7: Print (optional)
User can trigger `window.print()` to print a thermal receipt summary. The `SummaryPrint` portal renders a receipt-formatted layout that only appears in print media. Printing is blocked if the session is not closed.

---

## 7. Key Business Logic

### 7.1 Odoo Cash Calculation

The backend aggregates cash from multiple sources:

```
cash = cash_in_outs_total       # From account.bank.statement.line (excluding opening diffs)
     + sum(payments where method_id in CASH_METHOD_IDS)
     + opening_adjustment        # cash_register_balance_end - running_cash
```

### 7.2 End State Determination

Computed on the frontend:

```
odooTotal = odooCash + odooCard
cajaTotal = posCash + posCard
difference = cajaTotal - odooTotal

if difference < 0 → "missing" (Faltante)
if difference > 0 → "extra"   (Sobrante)
if difference = 0 → "stable"  (Estable)

endState.amount = |difference|
```

### 7.3 Cash Denomination Calculation

Each denomination stores a **quantity** (integer count). The total is:

```
posCash = d0_10 * 10     // 0.10 * 100 = 10 cents
        + d0_20 * 20
        + d0_50 * 50
        + d1_00 * 100
        + d2_00 * 200
        + d5_00 * 500
        + d10_00 * 1000
        + d20_00 * 2000
        + d50_00 * 5000
        + d100_00 * 10000
        + d200_00 * 20000
```

### 7.4 Snapshot Creation

Snapshots are created **only** when updating a session that already has `status = CLOSED`:

```
PUT request arrives
  → Check saved_session.status
  → If CLOSED: copy ALL fields to PosSessionV2Snapshot (including json blob)
  → Then apply updates to the original record
```

This preserves the previous closed state as an immutable audit record.

### 7.5 Autosave Flow

```
User types in denomination/card field
  → React state updates
  → useEffect triggers triggerAutosave()
  → Debounce timer starts (2000ms)
  → If user types again before 2000ms, timer resets
  → After 2000ms of inactivity:
      → PATCH /api/pos-close-control/v2/<sessionId>
      → Backend updates (or creates) PosSessionV2 with partial data
```

### 7.6 Fixed Balance Start Next Day

The frontend uses a constant `FIXED_BALANCE_START = 30000` (S/. 300.00) for `balanceStartNextDay` when saving.

---

## 8. Validation Rules

### Save constraints (frontend - `RightSection.tsx`)

| Rule | Condition | Error message |
|------|-----------|---------------|
| Session must be closed | `isSessionClosed === true` | "La sesión aún está abierta (Estado: Falso)" |
| Manager required | `selectedManager !== null` | "Debe seleccionar un Gerente" |
| Cashier required | `selectedCashier !== null` | "Debe seleccionar un Cajero" |
| Observations required when Faltante | `difference < 0 → observations.trim() !== ""` | "Las observaciones son requeridas cuando hay un Faltante" |

### Backend validation (views.py)

| Rule | HTTP status |
|------|-------------|
| Cashier and manager must exist and be active | 400 "Cajero o gerente inválido" |
| Valid JSON body | 400 "JSON inválido" |
| All required fields present | 400 "Falta el campo: <name>" |
| Session exists for PUT | 404 "Sesión no encontrada para actualizar" |

---

## 9. V1 vs V2 Comparison

| Feature | V1 (`PosSession`) | V2 (`PosSessionV2`) |
|---------|-------------------|---------------------|
| Amount storage | `DecimalField(12,2)` | `IntegerField` (cents) |
| Session status | None (one-shot insert) | `DRAFT` / `CLOSED` lifecycle |
| Autosave | No | Yes (PATCH with 2s debounce) |
| Snapshots | No | Yes (on CLOSED session update) |
| Cashier/Manager | Required on create | Nullable (for autosave) |
| `stop_at` | Required | Nullable (for autosave) |
| API pattern | Separate GET + POST endpoints | Single class-based view (GET/POST/PUT/PATCH) |
| End state values | `"EX"`, `"ST"`, `"MS"` (2-char) | `"EXTRA"`, `"STABLE"`, `"MISSING"` (word) |
| Frontend framework | Same React | Same React (v2 folder) |
| `balance_start_next_day` | User-provided | Fixed constant (S/. 300.00) |

---

## 10. File Reference

### Backend
| File | Description |
|------|-------------|
| `pos_close_control/models.py` | Employee, PosSession (V1), PosSessionV2, PosSessionV2Snapshot |
| `pos_close_control/views.py` | PosCloseControlV2View (GET/POST/PUT/PATCH), employee(), get_pos_details() (V1) |
| `pos_close_control/snapshot_views.py` | get_session_snapshots() |
| `pos_close_control/urls.py` | 5 URL patterns (V1 GET, V1 POST, employee, V2 CRUD, V2 snapshots) |
| `pos_close_control/rpc.py` | Odoo XML-RPC proxy (get_proxy, get_model, get_closing_control_data) |
| `miscellaneous/constants.py` | DRAFT, CLOSED, EXTRA, STABLE, MISSING, POS_STATUS_CHOICES, POS_END_STATE_CHOICES |
| `django_kdosh/urls.py` | Main URL dispatcher - includes pos_close_control.urls at root |
| `react/urls.py` | `/apps/pos-close-control/v2` → renders React app |
| `react/views.py` | `@login_required pos_close_control_view_v2()` |

### Frontend
| File | Description |
|------|-------------|
| `pos_close_control_v2/App.tsx` | Main orchestrator, all state management |
| `pos_close_control_v2/types.ts` | TypeScript interfaces (CashDenominations, CardAmounts, Summary, EndState, Snapshot, etc.) |
| `pos_close_control_v2/components/Header.tsx` | Session loader + snapshot history dropdown |
| `pos_close_control_v2/components/LeftSection.tsx` | Cash denomination table + card amounts table |
| `pos_close_control_v2/components/RightSection.tsx` | Bar comparator, summary table, employee dropdowns, observations, save button |
| `pos_close_control_v2/components/SummaryPrint.tsx` | Thermal printer portal (React createPortal into #print) |
| `pos_close_control_v2/hooks/useAutosave.ts` | Debounced autosave hook (2s default) |
| `pos_close_control_v2/utils/api.ts` | 6 API functions (fetch, submit, update, autosave, employees, snapshots) |
| `pos_close_control_v2/utils/formatters.ts` | Currency/date formatters (toDisplay, toStorage, formatCurrency, formatDate, formatDateForPrint) |
