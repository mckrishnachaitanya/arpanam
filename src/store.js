// ─── Constants ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'arpanam_data'

// ─── Default structure ────────────────────────────────────────────────────────
const defaultData = () => ({
  meta: {
    lastUpdated: new Date().toISOString(),
    version: 1,
  },
  settings: {
    splitPercent: 5,
    pinHash: null,
  },
  categories: [
    { id: uuid(), name: 'Parents',    emoji: '👨‍👩‍👧', order: 0, createdAt: new Date().toISOString() },
    { id: uuid(), name: 'In-laws',   emoji: '🏠',     order: 1, createdAt: new Date().toISOString() },
    { id: uuid(), name: 'Service',   emoji: '🔧',     order: 2, createdAt: new Date().toISOString() },
    { id: uuid(), name: 'Devotional',emoji: '🙏',     order: 3, createdAt: new Date().toISOString() },
    { id: uuid(), name: 'Others',    emoji: '📦',     order: 4, createdAt: new Date().toISOString() },
  ],
  transactions: [],
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function uuid() {
  return crypto.randomUUID()
}

/** Simple hash — not cryptographic, just obfuscation for PIN storage */
export async function hashPIN(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode('arpanam_salt_' + pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Core read/write ──────────────────────────────────────────────────────────
export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw)
    // Migrate if needed in future versions
    return parsed
  } catch {
    return defaultData()
  }
}

export function saveData(data) {
  const updated = {
    ...data,
    meta: {
      ...data.meta,
      lastUpdated: new Date().toISOString(),
    },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function getSettings(data) {
  return data.settings
}

export function savePIN(data, pinHash) {
  return saveData({
    ...data,
    settings: { ...data.settings, pinHash },
  })
}

export function removePIN(data) {
  return saveData({
    ...data,
    settings: { ...data.settings, pinHash: null },
  })
}

export function updateSplitPercent(data, percent) {
  return saveData({
    ...data,
    settings: { ...data.settings, splitPercent: percent },
  })
}

// ─── Categories ───────────────────────────────────────────────────────────────
export function getCategories(data) {
  return [...data.categories].sort((a, b) => a.order - b.order)
}

export function addCategory(data, { name, emoji }) {
  const newCat = {
    id: uuid(),
    name,
    emoji: emoji || '📁',
    order: data.categories.length,
    createdAt: new Date().toISOString(),
  }
  return saveData({
    ...data,
    categories: [...data.categories, newCat],
  })
}

export function updateCategory(data, id, changes) {
  return saveData({
    ...data,
    categories: data.categories.map(c => c.id === id ? { ...c, ...changes } : c),
  })
}

export function deleteCategory(data, id) {
  return saveData({
    ...data,
    categories: data.categories.filter(c => c.id !== id),
    // Keep transactions but they'll be orphaned — handle in UI
  })
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export function getTransactions(data, categoryId = null) {
  const txs = categoryId
    ? data.transactions.filter(t => t.categoryId === categoryId)
    : data.transactions
  return [...txs].sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function addTransaction(data, { categoryId, type, amount, note, date }) {
  const tx = {
    id: uuid(),
    categoryId,
    type,              // 'credit' | 'debit'
    amount: parseFloat(amount),
    note: note || (type === 'credit' ? 'Salary credit' : 'Expense'),
    date: date || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
  return saveData({
    ...data,
    transactions: [...data.transactions, tx],
  })
}

export function updateTransaction(data, id, changes) {
  return saveData({
    ...data,
    transactions: data.transactions.map(t =>
      t.id === id ? { ...t, ...changes } : t
    ),
  })
}

export function deleteTransaction(data, id) {
  return saveData({
    ...data,
    transactions: data.transactions.filter(t => t.id !== id),
  })
}

// ─── Balance computation ──────────────────────────────────────────────────────
/** Compute balance for a single category from transactions */
export function getCategoryBalance(data, categoryId) {
  return data.transactions
    .filter(t => t.categoryId === categoryId)
    .reduce((sum, t) => {
      return t.type === 'credit' ? sum + t.amount : sum - t.amount
    }, 0)
}

/** Compute balances for all categories */
export function getAllBalances(data) {
  const balances = {}
  data.categories.forEach(cat => {
    balances[cat.id] = getCategoryBalance(data, cat.id)
  })
  return balances
}

/** Total across all categories */
export function getTotalBalance(data) {
  return Object.values(getAllBalances(data)).reduce((a, b) => a + b, 0)
}

// ─── Salary credit helper ─────────────────────────────────────────────────────
/** Add salary — splits splitPercent equally across all categories */
export function addSalaryCredit(data, salaryAmount) {
  const { splitPercent } = data.settings
  const categories = getCategories(data)
  const perCategory = (salaryAmount * (splitPercent / 100)) / categories.length
  const now = new Date().toISOString()

  const newTransactions = categories.map(cat => ({
    id: uuid(),
    categoryId: cat.id,
    type: 'credit',
    amount: parseFloat(perCategory.toFixed(2)),
    note: `Salary credit (${splitPercent}% of ₹${salaryAmount.toLocaleString('en-IN')}, split across ${categories.length} categories)`,
    date: now,
    createdAt: now,
  }))

  return saveData({
    ...data,
    transactions: [...data.transactions, ...newTransactions],
  })
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)

export const fmtDate = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })
}
