import { useState } from 'react'
import { getCategories, generatePeriodTransactions, fmtMonth, saveData } from '../store'

export default function BulkPeriodScreen({ data, setData, onBack }) {
  const categories = getCategories(data)

  const [type, setType] = useState('credit')
  const [fromMonth, setFromMonth] = useState('')
  const [toMonth, setToMonth] = useState('')
  const [sameAmount, setSameAmount] = useState(true)
  const [sameNote, setSameNote] = useState(true)
  const [commonAmount, setCommonAmount] = useState('')
  const [commonNote, setCommonNote] = useState('')
  const [perCategory, setPerCategory] = useState(
    () => Object.fromEntries(categories.map(c => [c.id, { amount: '', note: '' }]))
  )
  const [err, setErr] = useState('')
  const [generatedIds, setGeneratedIds] = useState([])
  const [successRange, setSuccessRange] = useState(null) // { from, to } — saved on submit

  const updatePerCat = (id, field, value) =>
    setPerCategory(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))

  const handleToggleAmount = (val) => {
    if (!val && commonAmount) {
      setPerCategory(prev => {
        const u = { ...prev }
        categories.forEach(c => { u[c.id] = { ...u[c.id], amount: commonAmount } })
        return u
      })
    }
    setSameAmount(val)
  }

  const handleToggleNote = (val) => {
    if (!val && commonNote) {
      setPerCategory(prev => {
        const u = { ...prev }
        categories.forEach(c => { u[c.id] = { ...u[c.id], note: commonNote } })
        return u
      })
    }
    setSameNote(val)
  }

  const handleSubmit = () => {
    setErr('')
    if (!fromMonth || !toMonth) return setErr('Select from and to month')
    if (fromMonth > toMonth) return setErr('From month must be before To month')

    let generated = false
    let updatedData = data
    const newIds = []

    categories.forEach(cat => {
      const amt = sameAmount
        ? parseFloat(commonAmount)
        : parseFloat(perCategory[cat.id]?.amount)
      const note = sameNote ? commonNote : (perCategory[cat.id]?.note || '')
      if (!amt || amt <= 0) return

      const existingIds = new Set(updatedData.transactions.map(t => t.id))
      const result = generatePeriodTransactions(updatedData, {
        categoryId: cat.id, type, amount: amt,
        fromMonth, toMonth, note,
      })
      result.transactions
        .filter(t => !existingIds.has(t.id))
        .forEach(t => newIds.push(t.id))
      updatedData = result
      generated = true
    })

    if (!generated) return setErr('No valid amounts entered — nothing to generate')

    // Save range before resetting form state
    setSuccessRange({ from: fromMonth, to: toMonth })
    setGeneratedIds(newIds)
    setData(updatedData)
  }

  const handleUndo = () => {
    if (!generatedIds.length) return
    const updated = saveData({
      ...data,
      transactions: data.transactions.filter(t => !generatedIds.includes(t.id)),
    })
    setData(updated)
    setGeneratedIds([])
    setSuccessRange(null)
  }

  const handleReset = () => {
    setType('credit')
    setFromMonth('')
    setToMonth('')
    setSameAmount(true)
    setSameNote(true)
    setCommonAmount('')
    setCommonNote('')
    setPerCategory(Object.fromEntries(categories.map(c => [c.id, { amount: '', note: '' }])))
    setErr('')
    setGeneratedIds([])
    setSuccessRange(null)
  }

  // Success screen
  if (successRange) {
    return (
      <div style={s.root}>
        <div style={s.header}>
          <button onClick={onBack} style={s.backBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div style={s.headerTitle}>Bulk Period Entry</div>
          <div style={{ width: 38 }} />
        </div>
        <div style={s.successBox}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={s.successTitle}>Transactions generated!</div>
          <div style={s.successSub}>
            Monthly entries added from {fmtMonth(successRange.from)} to {fmtMonth(successRange.to)} for all categories with non-zero amounts.
          </div>
          <button onClick={handleReset} style={s.submitBtn}>Add another period</button>
          <button onClick={handleUndo} style={{ ...s.secondaryBtn, color: '#ef4444' }}>
            Undo — remove generated transactions
          </button>
          <button onClick={onBack} style={s.secondaryBtn}>Back to Settings</button>
        </div>
      </div>
    )
  }

  // Form screen
  return (
    <div style={s.root}>
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div style={s.headerTitle}>Bulk Period Entry</div>
        <div style={{ width: 38 }} />
      </div>

      <div style={s.body}>
        {/* Type */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Type</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['credit', 'debit'].map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ ...s.typeBtn, ...(type === t ? s.typeBtnActive : {}) }}>
                {t === 'credit' ? '+ Credit' : '− Debit'}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Date range</div>
          <div style={s.row2}>
            <div style={{ flex: 1 }}>
              <div style={s.fieldLabel}>From</div>
              <input type="month" value={fromMonth}
                onChange={e => setFromMonth(e.target.value)} style={s.input} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={s.fieldLabel}>To</div>
              <input type="month" value={toMonth}
                onChange={e => setToMonth(e.target.value)} style={s.input} />
            </div>
          </div>
        </div>

        {/* Amount */}
        <div style={s.section}>
          <div style={s.sectionTitleRow}>
            <div style={s.sectionTitle}>Amount</div>
            <Toggle label="Same for all" value={sameAmount} onChange={handleToggleAmount} />
          </div>
          {sameAmount ? (
            <input type="number" placeholder="0" value={commonAmount}
              onChange={e => setCommonAmount(e.target.value)} style={s.input} />
          ) : (
            <div style={s.catList}>
              {categories.map(cat => (
                <div key={cat.id} style={s.catRow}>
                  <div style={s.catLabel}>
                    <span style={s.catEmoji}>{cat.emoji}</span>
                    <span style={s.catName}>{cat.name}</span>
                  </div>
                  <input type="number" placeholder="0"
                    value={perCategory[cat.id]?.amount || ''}
                    onChange={e => updatePerCat(cat.id, 'amount', e.target.value)}
                    style={s.catInput} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note */}
        <div style={s.section}>
          <div style={s.sectionTitleRow}>
            <div style={s.sectionTitle}>
              Note <span style={s.optional}>(optional)</span>
            </div>
            <Toggle label="Same for all" value={sameNote} onChange={handleToggleNote} />
          </div>
          {sameNote ? (
            <input type="text" placeholder="Leave blank for default"
              value={commonNote} onChange={e => setCommonNote(e.target.value)} style={s.input} />
          ) : (
            <div style={s.catList}>
              {categories.map(cat => (
                <div key={cat.id} style={s.catRow}>
                  <div style={s.catLabel}>
                    <span style={s.catEmoji}>{cat.emoji}</span>
                    <span style={s.catName}>{cat.name}</span>
                  </div>
                  <input type="text" placeholder="Default"
                    value={perCategory[cat.id]?.note || ''}
                    onChange={e => updatePerCat(cat.id, 'note', e.target.value)}
                    style={s.catInput} />
                </div>
              ))}
            </div>
          )}
        </div>

        {err && <div style={s.err}>{err}</div>}
        <button onClick={handleSubmit} style={s.submitBtn}>Generate Transactions</button>
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#6b5a30' }}>{label}</span>
      <button onClick={() => onChange(!value)}
        style={{ ...ts.toggle, ...(value ? ts.toggleOn : {}) }}>
        <div style={{ ...ts.thumb, ...(value ? ts.thumbOn : {}) }} />
      </button>
    </div>
  )
}

const ts = {
  toggle: { width: 40, height: 22, background: '#2a2010', border: 'none', borderRadius: 11, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', padding: 0 },
  toggleOn: { background: '#ca8a04' },
  thumb: { width: 16, height: 16, background: '#6b5a30', borderRadius: '50%', position: 'absolute', top: 3, left: 3, transition: 'left 0.2s, background 0.2s' },
  thumbOn: { left: 21, background: '#0a0800' },
}

const s = {
  root: { minHeight: '100dvh', background: '#0a0800', color: '#f1f1f3', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 'max(32px, env(safe-area-inset-bottom))' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 16px 16px', borderBottom: '1px solid #1a1500' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: 700, color: '#f1f1f3' },
  body: { padding: '16px' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, color: '#6b5a30', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' },
  sectionTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  optional: { fontSize: 10, color: '#3a3020', textTransform: 'none', letterSpacing: 0 },
  row2: { display: 'flex', gap: 10 },
  fieldLabel: { fontSize: 11, color: '#6b5a30', marginBottom: 4 },
  input: { width: '100%', background: '#130f00', border: '1px solid #2a2010', borderRadius: 10, padding: '12px 14px', color: '#f1f1f3', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" },
  typeBtn: { flex: 1, background: '#130f00', border: '1px solid #2a2010', borderRadius: 10, padding: '12px', color: '#6b5a30', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  typeBtnActive: { background: '#1a1500', borderColor: '#ca8a04', color: '#fde047' },
  catList: { display: 'flex', flexDirection: 'column', gap: 8 },
  catRow: { background: '#130f00', border: '1px solid #2a2010', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  catLabel: { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  catEmoji: { fontSize: 18 },
  catName: { fontSize: 13, color: '#f1f1f3', fontWeight: 500 },
  catInput: { background: '#0a0800', border: '1px solid #2a2010', borderRadius: 8, padding: '8px 10px', color: '#f1f1f3', fontSize: 13, width: 100, textAlign: 'right', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif" },
  submitBtn: { width: '100%', background: '#ca8a04', color: '#0a0800', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  secondaryBtn: { width: '100%', background: 'transparent', color: '#6b5a30', border: 'none', padding: '12px', fontSize: 13, cursor: 'pointer', marginTop: 8 },
  err: { fontSize: 12, color: '#ef4444', marginBottom: 12 },
  successBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px', textAlign: 'center' },
  successTitle: { fontSize: 18, fontWeight: 700, color: '#fde047', marginBottom: 8 },
  successSub: { fontSize: 13, color: '#6b5a30', lineHeight: 1.6, marginBottom: 24 },
}
