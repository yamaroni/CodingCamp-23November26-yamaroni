# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that lets users record personal expenses, categorize them, and visualize spending distribution through a pie chart. The app runs entirely in the browser using HTML, CSS, and vanilla JavaScript, with data persisted in the browser's Local Storage. No backend, build toolchain, or test setup is required.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of an item name, a monetary amount, and a category.
- **Category**: One of three fixed expense groups: Food, Transport, or Fun.
- **Transaction_List**: The scrollable UI panel that displays all saved transactions.
- **Balance_Display**: The UI element at the top of the page that shows the running total of all transaction amounts.
- **Chart**: The pie chart that visualizes spending distribution by category.
- **Storage**: The browser's Local Storage API used to persist transactions between sessions.
- **Form**: The input form through which the user enters a new transaction.
- **Validator**: The client-side logic that checks Form inputs before a transaction is accepted.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter an item name, amount, and category so that I can record a new expense.

#### Acceptance Criteria

1. THE Form SHALL display an item name text field, a numeric amount field, and a category selector with the options Food, Transport, and Fun.
2. WHEN the user submits the Form with all fields filled and a valid positive numeric amount, THE App SHALL add the Transaction to the Transaction_List and persist it to Storage.
3. WHEN the user submits the Form with one or more empty fields, THE Validator SHALL display an inline error message indicating which fields are missing.
4. WHEN the user submits the Form with a non-positive or non-numeric value in the amount field, THE Validator SHALL display an inline error message stating that the amount must be a positive number.
5. WHEN a Transaction is successfully added, THE Form SHALL clear all input fields and reset to its default state.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my recorded expenses in a scrollable list so that I can review and manage them.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each Transaction's item name, amount, and category.
2. WHILE the number of transactions exceeds the visible area of the Transaction_List, THE Transaction_List SHALL be vertically scrollable.
3. THE Transaction_List SHALL display transactions in reverse-chronological order (most recently added first).
4. WHEN the user activates the delete control for a Transaction, THE App SHALL remove that Transaction from the Transaction_List and from Storage.
5. WHEN no transactions exist, THE Transaction_List SHALL display a message indicating that no expenses have been recorded.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending at the top of the page so that I can track how much I have spent overall.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of the amounts of all current transactions formatted as a currency value.
2. WHEN a Transaction is added, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
4. WHEN no transactions exist, THE Balance_Display SHALL display a total of zero.

---

### Requirement 4: Spending Distribution Chart

**User Story:** As a user, I want to see a pie chart of my spending by category so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL render as a pie chart with one segment per category that has at least one transaction.
2. WHEN a Transaction is added, THE Chart SHALL update automatically to reflect the new category distribution without requiring a page reload.
3. WHEN a Transaction is deleted, THE Chart SHALL update automatically to reflect the new category distribution without requiring a page reload.
4. WHEN all transactions belong to a single category, THE Chart SHALL render a single full-circle segment for that category.
5. WHEN no transactions exist, THE Chart SHALL display an empty state (no segments rendered).
6. THE Chart SHALL display a legend identifying each category by color.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my expenses to be saved between sessions so that I do not lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE Storage SHALL persist the transaction data immediately.
2. WHEN a Transaction is deleted, THE Storage SHALL remove the corresponding transaction data immediately.
3. WHEN the App loads, THE App SHALL read all previously saved transactions from Storage and render them in the Transaction_List, Balance_Display, and Chart.
4. IF Storage is unavailable or returns malformed data, THEN THE App SHALL initialize with an empty transaction list and display a non-blocking warning to the user.

---

### Requirement 6: Responsive Layout and Visual Design

**User Story:** As a user, I want the app to be easy to read and use on different screen sizes so that I can access it on any device.

#### Acceptance Criteria

1. THE App SHALL use a single CSS file located at `css/styles.css` for all styling.
2. THE App SHALL use a single JavaScript file located at `js/app.js` for all client-side logic.
3. THE App SHALL apply a clear visual hierarchy with the Balance_Display at the top, the Form and Transaction_List in the middle, and the Chart visible without excessive scrolling.
4. WHEN the viewport width is 600px or less, THE App SHALL reflow to a single-column layout.
5. THE App SHALL load and render within 2 seconds on a standard broadband connection.
6. THE App SHALL function in current stable releases of Chrome, Firefox, Edge, and Safari without polyfills.
