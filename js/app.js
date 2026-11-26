/* app.js — Expense & Budget Visualizer */

// ─── Module-level state ───────────────────────────────────────────────────────
let transactions = [];
let chart = null;
let storageWarning = false;

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Food:      "#FF6384",
  Transport: "#36A2EB",
  Fun:       "#FFCE56",
};

const VALID_CATEGORIES = Object.keys(CATEGORY_COLORS); // ["Food", "Transport", "Fun"]
const STORAGE_KEY = "expense-transactions";

// ─── Storage Module ───────────────────────────────────────────────────────────

/**
 * Validates that a single stored entry has the expected shape.
 * @param {unknown} entry
 * @returns {boolean}
 */
function isValidEntry(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    typeof entry.amount === "number" &&
    isFinite(entry.amount) &&
    entry.amount > 0 &&
    VALID_CATEGORIES.includes(entry.category) &&
    typeof entry.createdAt === "number"
  );
}

/**
 * Reads and parses transactions from localStorage.
 * - Returns [] and sets storageWarning on any top-level error.
 * - Silently drops individual entries that fail schema validation.
 * @returns {Transaction[]}
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      storageWarning = true;
      return [];
    }

    return parsed.filter(isValidEntry);
  } catch (_err) {
    storageWarning = true;
    return [];
  }
}

/**
 * Serializes transactions to localStorage.
 * Sets storageWarning on SecurityError or QuotaExceededError.
 * @param {Transaction[]} txns
 */
function saveTransactions(txns) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
  } catch (err) {
    storageWarning = true;
  }
}

// ─── Validation Module ────────────────────────────────────────────────────────

/**
 * Validates the expense form fields before a transaction is created.
 * @param {string} name     - Raw value from the item-name field.
 * @param {string} amount   - Raw value from the item-amount field.
 * @param {string} category - Raw value from the category selector.
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validateForm(name, amount, category) {
  const errors = {};

  if (!name || name.trim() === "") {
    errors.name = "Item name is required.";
  }

  const parsed = Number(amount);
  if (amount === "" || !isFinite(parsed) || parsed <= 0) {
    errors.amount = "Amount must be a positive number.";
  }

  if (!VALID_CATEGORIES.includes(category)) {
    errors.category = "Please select a category.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Transaction Module ───────────────────────────────────────────────────────

/**
 * Creates a new transaction, persists it, and triggers a render.
 * @param {string} name     - The expense item name.
 * @param {number} amount   - The positive numeric amount.
 * @param {string} category - One of the valid category keys.
 */
function addTransaction(name, amount, category) {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random().toString(36).slice(2);

  const transaction = { id, name, amount, category, createdAt: Date.now() };

  transactions.push(transaction);
  saveTransactions(transactions);
  render();
}

// ─── Node.js / test exports (not executed in the browser) ─────────────────────
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    get transactions() { return transactions; },
    set transactions(v) { transactions = v; },
    get storageWarning() { return storageWarning; },
    set storageWarning(v) { storageWarning = v; },
    CATEGORY_COLORS,
    VALID_CATEGORIES,
    STORAGE_KEY,
    isValidEntry,
    loadTransactions,
    saveTransactions,
    validateForm,
    addTransaction,
  };
}
