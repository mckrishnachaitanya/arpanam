// ─── Constants ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'arpanam_data'

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function uuid() {
  return crypto.randomUUID()
}

export async function hashPIN(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode('arpanam_salt_' + pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Default structure ────────────────────────────────────────────────────────
const makeDefaultData = () => ({
  meta: {
    lastUpdated: new Date().toISOString(),
    version: 1,
  },
  settings: {
    triggerDay: 1,       // 1 or 2 — day of month credits auto-generate
    pinHash: null,
  },
  categories: [
    { id: uuid(), name: 'Parents',     emoji: '👨‍👩‍👧', order: 0, monthlyAmount: 0, createdAt: new Date().toISOString() },
    { id: uuid(), name: 'In-laws',    emoji: '🏠',     order: 1, monthlyAmount: 0, createdAt: new Date().toISOString() },
    { id: uuid(), name: 'Service',    emoji: '🔧',     order: 2, monthlyAmount: 0, createdAt: new Date().toISOString() },
    { id: uuid(), name: 'Devotional', emoji: '🙏',     order: 3, monthlyAmount: 0, createdAt: new Date().toISOString() },
    { id: uuid(), name: 'Others',     emoji: '📦',     order: 4, monthlyAmount: 0, createdAt: new Date().toISOString() },
  ],
  transactions: [],
})

// ─── Core read/write ──────────────────────────────────────────────────────────
export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return makeDefaultData()
    return JSON.parse(raw)
  } catch {
    return makeDefaultData()
  }
}

export function saveData(data) {
  const updated = {
    ...data,
    meta: { ...data.meta, lastUpdated: new Date().toISOString() },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function updateSettings(data, changes) {
  return saveData({ ...data, settings: { ...data.settings, ...changes } })
}

export function savePIN(data, pinHash) {
  return updateSettings(data, { pinHash })
}

export function removePIN(data) {
  return updateSettings(data, { pinHash: null })
}

// ─── Categories ───────────────────────────────────────────────────────────────
export function getCategories(data) {
  return [...data.categories].sort((a, b) => a.order - b.order)
}

export function addCategory(data, { name, emoji, monthlyAmount = 0 }) {
  const cat = {
    id: uuid(), name, emoji: emoji || '📁',
    order: data.categories.length,
    monthlyAmount,
    createdAt: new Date().toISOString(),
  }
  return saveData({ ...data, categories: [...data.categories, cat] })
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
    transactions: data.transactions.filter(t => t.categoryId !== id),
  })
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export function getTransactions(data, categoryId = null, filter = 'all') {
  let txs = categoryId
    ? data.transactions.filter(t => t.categoryId === categoryId)
    : data.transactions
  if (filter === 'credit') txs = txs.filter(t => t.type === 'credit')
  if (filter === 'debit')  txs = txs.filter(t => t.type === 'debit')
  return [...txs].sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function addTransaction(data, { categoryId, type, amount, note, date }) {
  const tx = {
    id: uuid(), categoryId, type,
    amount: parseFloat(amount),
    note: note || (type === 'credit' ? 'Monthly credit' : 'Expense'),
    date: date || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    auto: false,
  }
  return saveData({ ...data, transactions: [...data.transactions, tx] })
}

export function updateTransaction(data, id, changes) {
  return saveData({
    ...data,
    transactions: data.transactions.map(t => t.id === id ? { ...t, ...changes } : t),
  })
}

export function deleteTransaction(data, id) {
  return saveData({
    ...data,
    transactions: data.transactions.filter(t => t.id !== id),
  })
}

// ─── Historical period generator ──────────────────────────────────────────────
/**
 * Generate transactions for a date range at a fixed monthly amount.
 * type: 'credit' | 'debit'
 * fromDate, toDate: 'YYYY-MM' strings
 */
export function generatePeriodTransactions(data, { categoryId, type, amount, fromMonth, toMonth, note }) {
  const [fromY, fromM] = fromMonth.split('-').map(Number)
  const [toY, toM] = toMonth.split('-').map(Number)

  const txs = []
  let y = fromY, m = fromM

  while (y < toY || (y === toY && m <= toM)) {
    const monthStr = `${y}-${String(m).padStart(2, '0')}`
    const date = new Date(y, m - 1, data.settings.triggerDay)
    const defaultNote = type === 'credit'
      ? `Monthly credit · ${fmtMonth(monthStr)}`
      : `Spent · ${fmtMonth(monthStr)}`

    txs.push({
      id: uuid(), categoryId, type,
      amount: parseFloat(amount),
      note: note || defaultNote,
      date: date.toISOString(),
      createdAt: new Date().toISOString(),
      auto: true,
    })

    m++
    if (m > 12) { m = 1; y++ }
  }

  return saveData({
    ...data,
    transactions: [...data.transactions, ...txs],
  })
}

// ─── Auto monthly credit trigger ─────────────────────────────────────────────
/**
 * Called on app load. Checks if any categories are due a monthly credit
 * and generates them if not already present.
 */
export function runAutoCredit(data) {
  const today = new Date()
  const triggerDay = data.settings.triggerDay
  let updated = data
  let changed = false

  // Only run on or after trigger day
  if (today.getDate() < triggerDay) return data

  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  for (const cat of data.categories) {
    if (!cat.monthlyAmount || cat.monthlyAmount <= 0) continue

    // Check if credit already exists for this month
    const alreadyCredited = data.transactions.some(t =>
      t.categoryId === cat.id &&
      t.type === 'credit' &&
      t.auto === true &&
      t.date.startsWith(currentMonth)
    )

    if (!alreadyCredited) {
      const date = new Date(today.getFullYear(), today.getMonth(), triggerDay)
      const tx = {
        id: uuid(),
        categoryId: cat.id,
        type: 'credit',
        amount: cat.monthlyAmount,
        note: `Monthly credit · ${fmtMonth(currentMonth)}`,
        date: date.toISOString(),
        createdAt: new Date().toISOString(),
        auto: true,
      }
      updated = { ...updated, transactions: [...updated.transactions, tx] }
      changed = true
    }
  }

  return changed ? saveData(updated) : data
}

// ─── Balance computation ──────────────────────────────────────────────────────
export function getCategoryBalance(data, categoryId) {
  return data.transactions
    .filter(t => t.categoryId === categoryId)
    .reduce((sum, t) => t.type === 'credit' ? sum + t.amount : sum - t.amount, 0)
}

export function getAllBalances(data) {
  const balances = {}
  data.categories.forEach(cat => {
    balances[cat.id] = getCategoryBalance(data, cat.id)
  })
  return balances
}

export function getTotalBalance(data) {
  return Object.values(getAllBalances(data)).reduce((a, b) => a + b, 0)
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n)

export const fmtDate = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export const fmtMonth = (yyyymm) => {
  const [y, m] = yyyymm.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function exportData(data) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `arpanam-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Import ───────────────────────────────────────────────────────────────────
export function validateBackup(parsed) {
  // Basic structure check
  if (!parsed || typeof parsed !== 'object') return false
  if (!parsed.meta?.lastUpdated) return false
  if (!Array.isArray(parsed.categories)) return false
  if (!Array.isArray(parsed.transactions)) return false
  if (!parsed.settings) return false
  return true
}

export function resolveImport(current, imported) {
  const currentDate = new Date(current.meta.lastUpdated)
  const importedDate = new Date(imported.meta.lastUpdated)
  return {
    importedIsNewer: importedDate > currentDate,
    currentDateStr: currentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    importedDateStr: importedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }
}
