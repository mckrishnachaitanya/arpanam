import { useState } from 'react'
import {
  getCategories, getTransactions, getCategoryBalance,
  addTransaction, updateTransaction, deleteTransaction,
  generatePeriodTransactions, fmt, fmtDate, fmtMonth
} from '../store'

const TABS = ['all', 'credit', 'debit']

export default function CategoryScreen({ data, setData, categoryId, onBack }) {
  const categories = getCategories(data)
  const cat = categories.find(c => c.id === categoryId)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null) // 'spend' | 'opening' | 'history' | 'edit'
  const [editTx, setEditTx] = useState(null)

  if (!cat) return null

  const txs = getTransactions(data, categoryId, filter)
  const balance = getCategoryBalance(data, categoryId)

  const closeModal = () => { setModal(null); setEditTx(null) }

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div style={s.headerCenter}>
          <span style={s.headerEmoji}>{cat.emoji}</span>
          <span style={s.headerName}>{cat.name}</span>
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* Balance card */}
      <div style={s.balanceCard}>
        <div style={s.balLabel}>Available balance</div>
        <div style={{ ...s.balAmount, color: balance >= 0 ? '#fde047' : '#ef4444' }}>{fmt(balance)}</div>
        <div style={s.balSub}>₹{cat.monthlyAmount?.toLocaleString('en-IN') || 0} / month</div>
      </div>

      {/* Action buttons */}
      <div style={s.actions}>
        <button onClick={() => setModal('spend')} style={s.actionBtn}>
          <span style={s.actionIcon}>💸</span>
          <span>Record Spend</span>
        </button>
        <button onClick={() => setModal('opening')} style={s.actionBtn}>
          <span style={s.actionIcon}>🏦</span>
          <span>Opening Balance</span>
        </button>
        <button onClick={() => setModal('history')} style={s.actionBtn}>
          <span style={s.actionIcon}>📅</span>
          <span>Add Period</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            ...s.tab, ...(filter === t ? s.tabActive : {})
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* Transaction list */}
      <div style={s.txList}>
        {txs.length === 0 ? (
          <div style={s.empty}>No transactions yet.</div>
        ) : txs.map(tx => (
          <div key={tx.id} style={s.txCard}>
            <div style={s.txLeft}>
              <div style={s.txNote}>{tx.note}</div>
              <div style={s.txDate}>{fmtDate(tx.date)}</div>
            </div>
            <div style={s.txRight}>
              <div style={{ ...s.txAmount, color: tx.type === 'credit' ? '#4ade80' : '#ef4444' }}>
                {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
              </div>
              <button onClick={() => { setEditTx(tx); setModal('edit') }} style={s.editBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b5a30" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal === 'spend' && (
        <SpendModal cat={cat} data={data} setData={setData} onClose={closeModal} categoryId={categoryId} />
      )}
      {modal === 'opening' && (
        <OpeningBalanceModal cat={cat} data={data} setData={setData} onClose={closeModal} categoryId={categoryId} />
      )}
      {modal === 'history' && (
        <HistoryPeriodModal cat={cat} data={data} setData={setData} onClose={closeModal} categoryId={categoryId} />
      )}
      {modal === 'edit' && editTx && (
        <EditTxModal tx={editTx} data={data} setData={setData} onClose={closeModal} />
      )}
    </div>
  )
}

// ── Spend Modal ───────────────────────────────────────────────────────────────
function SpendModal({ cat, data, setData, onClose, categoryId }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [err, setErr] = useState('')

  const submit = () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return setErr('Enter a valid amount')
    const updated = addTransaction(data, {
      categoryId, type: 'debit', amount: val, note, date: new Date(date).toISOString()
    })
    setData(updated)
    onClose()
  }

  return (
    <Modal title={`Spend from ${cat.name}`} onClose={onClose}>
      <Label>Amount</Label>
      <Input type="number" placeholder="₹0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      <Label>Note (optional)</Label>
      <Input type="text" placeholder="What was this for?" value={note} onChange={e => setNote(e.target.value)} />
      <Label>Date</Label>
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      {err && <div style={s.err}>{err}</div>}
      <SubmitBtn onClick={submit}>Record Spend</SubmitBtn>
    </Modal>
  )
}

// ── Opening Balance Modal ─────────────────────────────────────────────────────
function OpeningBalanceModal({ cat, data, setData, onClose, categoryId }) {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('credit')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [err, setErr] = useState('')

  const submit = () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return setErr('Enter a valid amount')
    const updated = addTransaction(data, {
      categoryId, type, amount: val,
      note: `Opening balance`,
      date: new Date(date).toISOString()
    })
    setData(updated)
    onClose()
  }

  return (
    <Modal title={`Opening Balance — ${cat.name}`} onClose={onClose}>
      <Label>Type</Label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['credit', 'debit'].map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            ...s.typeBtn, ...(type === t ? s.typeBtnActive : {})
          }}>{t === 'credit' ? '+ Credit' : '− Debit'}</button>
        ))}
      </div>
      <Label>Amount</Label>
      <Input type="number" placeholder="₹0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      <Label>As of date</Label>
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      {err && <div style={s.err}>{err}</div>}
      <SubmitBtn onClick={submit}>Set Balance</SubmitBtn>
    </Modal>
  )
}

// ── History Period Modal ──────────────────────────────────────────────────────
function HistoryPeriodModal({ cat, data, setData, onClose, categoryId }) {
  const [type, setType] = useState('credit')
  const [amount, setAmount] = useState('')
  const [fromMonth, setFromMonth] = useState('')
  const [toMonth, setToMonth] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  // Show existing auto-generated periods for this category
  const existingPeriods = (() => {
    const txs = data.transactions
      .filter(t => t.categoryId === categoryId && t.auto)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    if (!txs.length) return []
    // Group into contiguous periods by type+amount
    const periods = []
    let current = null
    for (const tx of txs) {
      const month = tx.date.slice(0, 7)
      if (!current || current.type !== tx.type || current.amount !== tx.amount) {
        if (current) periods.push(current)
        current = { type: tx.type, amount: tx.amount, from: month, to: month }
      } else {
        current.to = month
      }
    }
    if (current) periods.push(current)
    return periods
  })()

  const submit = () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return setErr('Enter a valid amount')
    if (!fromMonth || !toMonth) return setErr('Select from and to month')
    if (fromMonth > toMonth) return setErr('From month must be before To month')
    const updated = generatePeriodTransactions(data, {
      categoryId, type, amount: val, fromMonth, toMonth, note
    })
    setData(updated)
    onClose()
  }

  return (
    <Modal title={`Add Period — ${cat.name}`} onClose={onClose}>
      {existingPeriods.length > 0 && (
        <div style={s.periodsBox}>
          <div style={s.periodsTitle}>Existing periods</div>
          {existingPeriods.map((p, i) => (
            <div key={i} style={s.periodRow}>
              <span style={{ color: p.type === 'credit' ? '#4ade80' : '#ef4444', fontSize: 11 }}>
                {p.type === 'credit' ? '▲' : '▼'}
              </span>
              <span style={{ fontSize: 12, color: '#a08040' }}>
                {fmtMonth(p.from)} – {fmtMonth(p.to)} · ₹{p.amount.toLocaleString('en-IN')}/mo
              </span>
            </div>
          ))}
        </div>
      )}
      <Label>Type</Label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['credit', 'debit'].map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            ...s.typeBtn, ...(type === t ? s.typeBtnActive : {})
          }}>{t === 'credit' ? '+ Credit' : '− Debit'}</button>
        ))}
      </div>
      <Label>Monthly amount</Label>
      <Input type="number" placeholder="₹0" value={amount} onChange={e => setAmount(e.target.value)} />
      <Label>From month</Label>
      <Input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)} />
      <Label>To month</Label>
      <Input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)} />
      <Label>Note (optional — defaults to "Spent · Mon YYYY")</Label>
      <Input type="text" placeholder="Custom note" value={note} onChange={e => setNote(e.target.value)} />
      {err && <div style={s.err}>{err}</div>}
      <SubmitBtn onClick={submit}>Generate Transactions</SubmitBtn>
    </Modal>
  )
}

// ── Edit Transaction Modal ────────────────────────────────────────────────────
function EditTxModal({ tx, data, setData, onClose }) {
  const [amount, setAmount] = useState(String(tx.amount))
  const [note, setNote] = useState(tx.note)
  const [date, setDate] = useState(tx.date.slice(0, 10))
  const [err, setErr] = useState('')

  const save = () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return setErr('Enter a valid amount')
    setData(updateTransaction(data, tx.id, {
      amount: val, note, date: new Date(date).toISOString()
    }))
    onClose()
  }

  const remove = () => {
    if (confirm('Delete this transaction?')) {
      setData(deleteTransaction(data, tx.id))
      onClose()
    }
  }

  return (
    <Modal title="Edit Transaction" onClose={onClose}>
      <Label>Amount</Label>
      <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      <Label>Note</Label>
      <Input type="text" value={note} onChange={e => setNote(e.target.value)} />
      <Label>Date</Label>
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      {err && <div style={s.err}>{err}</div>}
      <SubmitBtn onClick={save}>Save Changes</SubmitBtn>
      <button onClick={remove} style={s.deleteBtn}>Delete transaction</button>
    </Modal>
  )
}

// ── Shared UI components ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <div style={s.modalTitle}>{title}</div>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>
        <div style={s.modalBody}>{children}</div>
      </div>
    </div>
  )
}

function Label({ children }) {
  return <div style={s.label}>{children}</div>
}

function Input(props) {
  return <input {...props} style={{ ...s.input, ...(props.style || {}) }} />
}

function SubmitBtn({ onClick, children }) {
  return <button onClick={onClick} style={s.submitBtn}>{children}</button>
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  root: {
    minHeight: '100dvh', background: '#0a0800', color: '#f1f1f3',
    fontFamily: "'Inter', system-ui, sans-serif",
    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '52px 16px 16px', borderBottom: '1px solid #1a1500',
  },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 8 },
  headerCenter: { display: 'flex', alignItems: 'center', gap: 8 },
  headerEmoji: { fontSize: 20 },
  headerName: { fontSize: 17, fontWeight: 700, color: '#f1f1f3' },
  balanceCard: {
    margin: '16px', background: '#130f00', border: '1px solid #2a2010',
    borderRadius: 16, padding: '18px 20px',
  },
  balLabel: { fontSize: 12, color: '#6b5a30', marginBottom: 4 },
  balAmount: { fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 },
  balSub: { fontSize: 11, color: '#3a3020' },
  actions: { display: 'flex', gap: 8, padding: '0 16px', marginBottom: 16 },
  actionBtn: {
    flex: 1, background: '#1a1500', border: '1px solid #2a2010',
    borderRadius: 12, padding: '12px 8px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    color: '#ca8a04', fontSize: 11, fontWeight: 600,
    WebkitTapHighlightColor: 'transparent',
  },
  actionIcon: { fontSize: 20 },
  tabs: { display: 'flex', gap: 8, padding: '0 16px', marginBottom: 12 },
  tab: {
    background: 'transparent', border: '1px solid #2a2010', borderRadius: 20,
    padding: '6px 16px', color: '#6b5a30', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  tabActive: { background: '#2a2010', color: '#fde047', borderColor: '#3a3010' },
  txList: { padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  txCard: {
    background: '#130f00', border: '1px solid #1a1500', borderRadius: 12,
    padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  txLeft: { flex: 1, marginRight: 8 },
  txNote: { fontSize: 13, fontWeight: 500, color: '#f1f1f3', marginBottom: 3 },
  txDate: { fontSize: 11, color: '#6b5a30' },
  txRight: { display: 'flex', alignItems: 'center', gap: 8 },
  txAmount: { fontSize: 14, fontWeight: 700 },
  editBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  empty: { fontSize: 13, color: '#3a3020', textAlign: 'center', padding: '32px 0' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
    display: 'flex', alignItems: 'flex-end',
  },
  modal: {
    background: '#130f00', borderTop: '1px solid #2a2010',
    borderRadius: '20px 20px 0 0', width: '100%',
    maxHeight: '90dvh', overflowY: 'auto',
    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 20px 12px',
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#fde047' },
  closeBtn: { background: 'none', border: 'none', color: '#6b5a30', fontSize: 18, cursor: 'pointer' },
  modalBody: { padding: '0 20px' },
  label: { fontSize: 12, color: '#6b5a30', fontWeight: 600, marginBottom: 6 },
  input: {
    width: '100%', background: '#0a0800', border: '1px solid #2a2010',
    borderRadius: 10, padding: '12px 14px', color: '#f1f1f3',
    fontSize: 15, boxSizing: 'border-box', outline: 'none', marginBottom: 14,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  submitBtn: {
    width: '100%', background: '#ca8a04', color: '#0a0800', border: 'none',
    borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginTop: 4,
  },
  deleteBtn: {
    width: '100%', background: 'transparent', color: '#ef4444', border: 'none',
    padding: '14px', fontSize: 13, cursor: 'pointer', marginTop: 8,
  },
  typeBtn: {
    flex: 1, background: '#0a0800', border: '1px solid #2a2010',
    borderRadius: 8, padding: '10px', color: '#6b5a30', fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
  typeBtnActive: { background: '#1a1500', borderColor: '#ca8a04', color: '#fde047' },
  periodsBox: {
    background: '#0a0800', border: '1px solid #1a1500', borderRadius: 10,
    padding: '12px', marginBottom: 16,
  },
  periodsTitle: { fontSize: 11, color: '#6b5a30', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
  periodRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  err: { fontSize: 12, color: '#ef4444', marginBottom: 10 },
}
