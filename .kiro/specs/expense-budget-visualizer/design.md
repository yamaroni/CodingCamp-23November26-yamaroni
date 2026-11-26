# Design Document

## Overview

The Expense & Budget Visualizer is a single-page web application delivered as three static files: `index.html`, `css/styles.css`, and `js/app.js`. It runs entirely in the browser with no server, build step, or framework. All expense data is serialized to and read from `localStorage`. A pie chart rendered by Chart.js (loaded from CDN) visualizes spending by category.

The app has four visible regions:

1. **Balance Display** — running total at the top.
2. **Input Form** — item name, amount, and category selector.
3. **Transaction List** — scrollable, reverse-chronological list of entries with per-row delete.
4. **Chart** — pie chart of spending by category with a built-in legend.

All four regions update synchronously on every add or delete; no page reload is involved.

---

## Architecture

The app follows a **single-source-of-truth** pattern: an in-memory array `transactions` is the canonical state. Every mutation (add, delete, load from storage) updates that array, then calls a single `render()` function that rebuilds all four UI regions from scratch. This keeps state and DOM tightly synchronized without a virtual DOM or reactive framework.

```mermaid
flowchart TD
    subgraph Input
        F[Form submit]
        DEL[Delete button click]
        LOAD[DOMContentLoaded]
    end

    subgraph State
        ARR[transactions array]
        LS[localStorage]
    end

    subgraph Output
        BD[Balance Display]
        TL[Transaction List]
        CH[Chart.js pie chart]
    end

    F -->|validate → push| ARR
    F -->|save| LS
    DEL -->|splice| ARR
    DEL -->|save| LS
    LOAD -->|parse| LS
    LOAD -->|populate| ARR

    ARR -->|render()| BD
    ARR -->|render()| TL
    ARR -->|render()| CH
```

**Key design decisions:**

| Decision | Choice | Rationale |
|---|---|---|
| State management | In-memory array + full re-render | Simplest correct approach for ≤ a few hundred transactions; avoids incremental DOM diffing bugs |
| Chart library | Chart.js v4 via CDN | Widely used, well-documented, no build step needed, pie chart support built-in |
| Persistence | `localStorage` only | Requirement constraint; synchronous API keeps code simple |
| File structure | One HTML, one CSS, one JS | Requirement constraint |

---

## Components and Interfaces

All logic lives in `js/app.js`. The file is organized into the following logical sections, each a group of functions:

### 1. Storage Module

Responsible for reading and writing `localStorage`.

```
loadTransactions() → Transaction[]
saveTransactions(transactions: Transaction[]) → void
```

- `loadTransactions` reads the key `"expense-transactions"`, parses JSON, validates the shape of each entry, and returns an array. Returns `[]` on any error and sets a flag that triggers a user-visible warning.
- `saveTransactions` serializes the array and writes it back under the same key.

### 2. Validation Module

```
validateForm(name: string, amount: string, category: string) → ValidationResult
```

`ValidationResult`:
```
{
  valid: boolean,
  errors: { name?: string, amount?: string, category?: string }
}
```

Rules:
- `name`: must be non-empty after trimming.
- `amount`: must parse as a finite number greater than zero.
- `category`: must be one of `"Food"`, `"Transport"`, `"Fun"`.

### 3. Transaction Module

```
addTransaction(name: string, amount: number, category: string) → Transaction
deleteTransaction(id: string) → void
```

`addTransaction` creates a new `Transaction` object, pushes it to the in-memory array, persists, and calls `render()`.  
`deleteTransaction` finds and removes the entry by `id`, persists, and calls `render()`.

### 4. Render Module

```
render() → void
renderBalanceDisplay() → void
renderTransactionList() → void
renderChart() → void
```

`render()` calls the three sub-functions in order. Each reads from the in-memory array and updates its DOM target.

`renderChart()` calls `chart.destroy()` before recreating the Chart.js instance to prevent canvas reuse warnings.

### 5. Initialization

```
init() → void
```

Called on `DOMContentLoaded`. Loads transactions from storage, populates the in-memory array, calls `render()`, and attaches the form submit handler.

### HTML Skeleton (index.html)

```
<body>
  <header>
    <h1>Expense & Budget Visualizer</h1>
    <div id="balance-display">Total: $0.00</div>
  </header>

  <main>
    <section id="form-section">
      <form id="expense-form">
        <input id="item-name" type="text" …>
        <input id="item-amount" type="number" …>
        <select id="item-category">…</select>
        <button type="submit">Add Expense</button>
      </form>
      <div id="form-errors" aria-live="polite"></div>
    </section>

    <section id="list-section">
      <ul id="transaction-list"></ul>
    </section>

    <section id="chart-section">
      <canvas id="spending-chart"></canvas>
    </section>
  </main>

  <div id="storage-warning" hidden>…</div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="js/app.js"></script>
</body>
```

---

## Data Models

### Transaction

```js
{
  id:       string,   // crypto.randomUUID() or Date.now().toString() fallback
  name:     string,   // trimmed, non-empty item description
  amount:   number,   // positive finite float
  category: string,   // "Food" | "Transport" | "Fun"
  createdAt: number   // Date.now() timestamp for ordering
}
```

### In-memory state

```js
let transactions = [];   // Transaction[]
let chart = null;        // Chart.js instance or null
let storageWarning = false;
```

### localStorage schema

Key: `"expense-transactions"`  
Value: JSON-serialized `Transaction[]`

On load, each stored object is validated to have `id` (string), `name` (string), `amount` (positive number), `category` (one of the three values), and `createdAt` (number). Any entry failing validation is dropped silently; if the top-level parse fails entirely, `storageWarning` is set to `true`.

### Category color map

```js
const CATEGORY_COLORS = {
  Food:      "#FF6384",
  Transport: "#36A2EB",
  Fun:       "#FFCE56"
};
```

### Chart.js configuration (pie chart)

```js
{
  type: "pie",
  data: {
    labels:   [...categories],           // only categories with sum > 0
    datasets: [{
      data:            [...sums],
      backgroundColor: [...colors]
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: $${ctx.parsed.toFixed(2)}`
        }
      }
    }
  }
}
```

When `transactions` is empty, `renderChart()` destroys any existing Chart.js instance and leaves the canvas blank (empty-state message shown via CSS `::after` pseudo-element or a sibling `<p>` element).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Whitespace-only or empty names are rejected

*For any* string composed entirely of whitespace characters (including the empty string) used as the item name, `validateForm` must return `valid: false` with an error entry for the `name` field, and the transaction list must remain unchanged.

**Validates: Requirements 1.3**

### Property 2: Non-positive or non-numeric amounts are rejected

*For any* amount value that is zero, negative, `NaN`, or non-numeric, `validateForm` must return `valid: false` with an error entry for the `amount` field, and the transaction list must remain unchanged.

**Validates: Requirements 1.4**

### Property 3: Transaction list contains exactly the added transactions in newest-first order

*For any* sequence of valid add operations, the resulting transaction list must contain every added transaction (by `id`) with no extra entries, and the entries must be ordered with the most recently created transaction first (descending `createdAt`).

**Validates: Requirements 1.2, 2.1, 2.3, 5.1**

### Property 4: Delete removes exactly the targeted transaction from list and storage

*For any* transaction list and any transaction in that list, calling `deleteTransaction(id)` must produce a list whose length is exactly one less than before, containing all original entries except the deleted one, and the same state must be reflected in localStorage after the call.

**Validates: Requirements 2.4, 5.2**

### Property 5: Balance always equals the arithmetic sum of all transaction amounts

*For any* transaction list (including the empty list), the calculated balance value must equal the sum of all `amount` fields, returning zero when the list is empty.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: Chart data segments match per-category transaction sums

*For any* transaction list, the chart data preparation function must produce exactly one segment per distinct category that has at least one transaction, and each segment's value must equal the sum of `amount` fields for that category. The function must return empty labels and data arrays when the transaction list is empty.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 7: Storage round-trip preserves all transaction data

*For any* transaction list, calling `saveTransactions` followed by `loadTransactions` must return an array of equal length where each entry has identical `id`, `name`, `amount`, `category`, and `createdAt` values to the original.

**Validates: Requirements 5.3**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Empty or whitespace-only name | Inline error below name field: "Item name is required." |
| Amount is zero, negative, or non-numeric | Inline error below amount field: "Amount must be a positive number." |
| Category not selected | Inline error below category field: "Please select a category." |
| `localStorage` unavailable (SecurityError) | `storageWarning = true`; non-blocking banner shown; app works in-memory for the session |
| `localStorage` returns malformed JSON | Same as unavailable: banner shown, start with empty list |
| Individual stored entry fails validation | Entry silently dropped; remaining valid entries load normally |
| `crypto.randomUUID` unavailable (older Safari) | Falls back to `Date.now().toString() + Math.random().toString(36).slice(2)` |
| Chart.js CDN fails to load | `renderChart` guards on `typeof Chart !== "undefined"`; a text message is shown in the chart section: "Chart library could not be loaded." |

Validation errors are cleared on the next successful form submission. Each error message is associated with its field via `aria-describedby` for accessibility.

---

## Testing Strategy

### Dual Testing Approach

This app separates concerns into pure functions (validation, balance calculation, chart data preparation, storage serialization) and DOM side-effects (rendering). Pure functions are tested with property-based tests; the DOM layer is verified with example-based unit tests and manual smoke tests.

**Property-based testing library:** [fast-check](https://github.com/dubzzz/fast-check) (Node.js / Jest environment for the pure-logic layer; no browser required).

Each property test must run a minimum of 100 iterations. Each test is tagged with a comment in the format:
> `// Feature: expense-budget-visualizer, Property N: <property text>`

### Property-Based Tests

These test the seven Correctness Properties above against arbitrary generated inputs.

| Property | Module under test | fast-check arbitraries |
|---|---|---|
| P1: Whitespace names rejected | `validateForm` | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| P2: Non-positive amounts rejected | `validateForm` | `fc.oneof(fc.double({ max: 0 }), fc.constant(NaN), fc.string())` |
| P3: Transaction list contains added transactions in newest-first order | `addTransaction` (pure, localStorage mocked) | `fc.array(fc.record({ name: fc.string(), amount: fc.double({ min: 0.01 }), category: fc.constantFrom('Food','Transport','Fun') }))` |
| P4: Delete removes exactly the targeted transaction | `deleteTransaction` (pure, localStorage mocked) | `fc.array(validTransactionArbitrary, { minLength: 1 })` + `fc.integer` to pick index |
| P5: Balance equals sum of amounts | `calculateBalance` | `fc.array(fc.double({ min: 0.01, max: 1_000_000 }))` |
| P6: Chart data segments match category sums | `buildChartData` | `fc.array(validTransactionArbitrary)` |
| P7: Storage round-trip preserves data | `saveTransactions` / `loadTransactions` (localStorage mocked) | `fc.array(validTransactionArbitrary)` |

### Unit Tests (example-based)

For behaviors that do not vary meaningfully with input:

**Form rendering:**
- Form has `input#item-name`, `input#item-amount`, `select#item-category`.
- Category selector has exactly three options: Food, Transport, Fun.

**Form clear on success:**
- After a valid submission, all fields are empty / reset to default.

**Empty-state rendering:**
- Render with `[]` → transaction list contains the empty-state message.

**Chart.js config:**
- `buildChartData` output includes `options.plugins.legend` with `position: "bottom"`.

**Storage error handling:**
- `loadTransactions` returns `[]` and sets `storageWarning` when `localStorage.getItem` throws.
- `loadTransactions` returns `[]` and sets `storageWarning` on malformed JSON.
- `loadTransactions` silently drops entries that fail schema validation.

**Delete nonexistent id:**
- `deleteTransaction` with an unknown id leaves the array unchanged.

### Integration / Manual Smoke Tests

Run manually in a browser:

1. Open `index.html` in Chrome, Firefox, Edge, and Safari — no console errors.
2. Add expenses across all three categories — list, balance, and chart all update.
3. Delete a transaction — list shrinks, balance recalculates, chart updates.
4. Reload the page — all saved transactions reappear.
5. Resize viewport to ≤ 600px — layout reflows to a single column.
6. Block the Chart.js CDN in DevTools — fallback message appears in the chart section.
7. Disable localStorage (private browsing) — warning banner appears; app works in-memory.

### Accessibility Checks

- Form error messages use `aria-live="polite"` and `aria-describedby` linking to their field.
- Delete buttons carry descriptive `aria-label` attributes (e.g., `"Delete Lunch"`).
- Text color contrast meets WCAG AA against all background colors.
