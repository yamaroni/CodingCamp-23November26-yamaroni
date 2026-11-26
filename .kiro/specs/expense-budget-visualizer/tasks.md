# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a zero-dependency, single-page expense tracker as three static files (`index.html`, `css/styles.css`, `js/app.js`). The implementation follows the single-source-of-truth pattern defined in the design: an in-memory `transactions` array drives all four UI regions through a central `render()` function. Chart.js is loaded from CDN; data is persisted to `localStorage`.

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html` at the workspace root with the full HTML skeleton from the design: `<header>` with `#balance-display`, `<main>` with `#form-section`, `#list-section`, and `#chart-section`, a `#storage-warning` div (hidden), the Chart.js CDN `<script>` tag, and a `<script src="js/app.js">` tag
  - Create `css/styles.css` as an empty file (styling added in task 3)
  - Create `js/app.js` as an empty file (logic added in tasks 2–6)
  - Add `<link rel="stylesheet" href="css/styles.css">` inside `<head>`
  - Ensure `index.html` includes `<canvas id="spending-chart">`, `<ul id="transaction-list">`, `<div id="form-errors" aria-live="polite">`, and `<button type="submit">Add Expense</button>`
  - _Requirements: 1.1, 6.1, 6.2_

- [x] 2. Implement the Storage and Validation modules in `js/app.js`
  - [x] 2.1 Implement the Storage module
    - Declare `let transactions = []; let chart = null; let storageWarning = false;` as module-level state
    - Define `const CATEGORY_COLORS` map for Food, Transport, Fun
    - Implement `loadTransactions()`: read `"expense-transactions"` from `localStorage`, parse JSON, validate each entry (id: string, name: string, amount: positive number, category: one of three values, createdAt: number), drop invalid entries silently, return `[]` and set `storageWarning = true` on any top-level error
    - Implement `saveTransactions(transactions)`: serialize and write the array back under `"expense-transactions"`; catch `SecurityError` and set `storageWarning = true`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_



  - [x] 2.3 Implement the Validation module
    - Implement `validateForm(name, amount, category)` returning `{ valid, errors: { name?, amount?, category? } }`
    - Rules: `name` non-empty after trimming; `amount` parses as a finite number > 0; `category` is one of `"Food"`, `"Transport"`, `"Fun"`
    - _Requirements: 1.3, 1.4_


- [ ] 3. Implement the Transaction module in `js/app.js`
  - [-] 3.1 Implement `addTransaction(name, amount, category)`
    - Generate `id` via `crypto.randomUUID()` with fallback to `Date.now().toString() + Math.random().toString(36).slice(2)` for older Safari
    - Set `createdAt` to `Date.now()`
    - Push the new `Transaction` object to the in-memory array, call `saveTransactions`, then call `render()`
    - _Requirements: 1.2, 5.1_


  - [~] 3.3 Implement `deleteTransaction(id)`
    - Find and remove the entry with the matching `id` from the in-memory array using `splice`
    - Call `saveTransactions`, then call `render()`
    - If `id` is not found, leave the array unchanged (no error)
    - _Requirements: 2.4, 5.2_


- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement pure render-helper functions in `js/app.js`
  - [~] 5.1 Implement `calculateBalance(transactions)`
    - Return the sum of all `amount` fields; return `0` for an empty array
    - _Requirements: 3.1, 3.2, 3.3, 3.4_


  - [~] 5.3 Implement `buildChartData(transactions)`
    - Aggregate amounts per category; include only categories with sum > 0
    - Return `{ labels, data, colors }` using `CATEGORY_COLORS`; return empty arrays when no transactions exist
    - _Requirements: 4.1, 4.4, 4.5_


- [ ] 6. Implement the Render module in `js/app.js`
  - [~] 6.1 Implement `renderBalanceDisplay()`
    - Read `calculateBalance(transactions)` and write the formatted currency string to `#balance-display`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [~] 6.2 Implement `renderTransactionList()`
    - Clear `#transaction-list` and rebuild it from the `transactions` array sorted by `createdAt` descending
    - Each `<li>` shows item name, formatted amount, and category
    - Each row includes a delete `<button>` with an `aria-label` of `"Delete <item name>"` that calls `deleteTransaction(id)` on click
    - When `transactions` is empty, insert an `<li>` with the empty-state message: "No expenses recorded yet."
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [~] 6.3 Implement `renderChart()`
    - Guard on `typeof Chart !== "undefined"`; show `"Chart library could not be loaded."` in `#chart-section` if Chart.js is absent
    - Call `chart.destroy()` before recreating when a Chart.js instance already exists
    - Use `buildChartData(transactions)` to populate `labels`, `data`, and `backgroundColor`
    - Apply the Chart.js config from the design: `type: "pie"`, `legend.position: "bottom"`, dollar-formatted tooltip callback
    - Leave the canvas blank (and show an empty-state `<p>`) when `transactions` is empty
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [~] 6.4 Implement `render()`
    - Call `renderBalanceDisplay()`, `renderTransactionList()`, and `renderChart()` in order
    - Show or hide `#storage-warning` based on the `storageWarning` flag
    - _Requirements: 3.2, 3.3, 4.2, 4.3, 5.4_

- [~] 7. Implement form handling and `init()` in `js/app.js`
  - Implement `init()`: call `loadTransactions()`, populate `transactions`, call `render()`, and attach a `submit` event listener to `#expense-form`
  - In the submit handler: call `event.preventDefault()`, read field values, call `validateForm`, display errors in `#form-errors` with `aria-describedby` links if invalid, or call `addTransaction` and clear all fields if valid
  - Bind `init` to `DOMContentLoaded`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.3_

- [~] 8. Write CSS in `css/styles.css`
  - Apply a clear visual hierarchy: `#balance-display` at the top, form and list in the middle, chart below
  - Use CSS Flexbox or Grid so the form and list sit side-by-side on wide viewports and stack vertically at ≤ 600px (`@media (max-width: 600px)`)
  - Style the transaction list to be vertically scrollable with a max-height
  - Ensure text color contrast meets WCAG AA for all text/background combinations
  - Add a `::after` or sibling `<p>` empty-state style for the chart section
  - _Requirements: 6.1, 6.3, 6.4_

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) in a Node.js/Jest environment; no browser is required to run them
- The seven correctness properties from the design map one-to-one to property test sub-tasks (2.2, 2.4, 3.2, 3.4, 5.2, 5.4) — Property 1 and Property 2 are covered together in task 2.4
- Checkpoints at tasks 4 and 9 mark natural integration points

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "2.4"] },
    { "id": 3, "tasks": ["3.1", "3.3"] },
    { "id": 4, "tasks": ["3.2", "3.4"] },
    { "id": 5, "tasks": ["4"] },
    { "id": 6, "tasks": ["5.1", "5.3"] },
    { "id": 7, "tasks": ["5.2", "5.4"] },
    { "id": 8, "tasks": ["6.1", "6.2", "6.3"] },
    { "id": 9, "tasks": ["6.4"] },
    { "id": 10, "tasks": ["7"] },
    { "id": 11, "tasks": ["8"] },
    { "id": 12, "tasks": ["9"] }
  ]
}
```
