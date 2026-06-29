import { useState } from 'react'
import {
  getCategories, addCategory, updateCategory, deleteCategory,
  updateSettings, savePIN, removePIN, hashPIN, fmt,
  exportData, validateBackup, resolveImport, saveData
} from '../store'

export default function SettingsScreen({ data, setData, onBack }) {
  const [section, setSection] = useState(null) // 'categories' | 'pin' | 'trigger'
  const categories = getCategories(data)

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div style={s.headerTitle}>Settings</div>
        <div style={{ width: 38 }} />
      </div>

      <div style={s.body}>
        {/* Trigger day */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Monthly credit trigger</div>
          <div style={s.row}>
            <div style={s.rowLabel}>Credits generate on</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2].map(d => (
                <button key={d} onClick={() => setData(updateSettings(data, { triggerDay: d }))}
                  style={{ ...s.dayBtn, ...(data.settings.triggerDay === d ? s.dayBtnActive : {}) }}>
                  {d === 1 ? '1st' : '2nd'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Buckets */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Buckets</div>
          {categories.map(cat => (
            <BucketRow key={cat.id} cat={cat} data={data} setData={setData} />
          ))}
          <AddBucketRow data={data} setData={setData} />
        </div>

        {/* PIN */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Security</div>
          <PINSection data={data} setData={setData} />
        </div>

        {/* Data */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Data</div>
          <DataSection data={data} setData={setData} />
        </div>
      </div>
    </div>
  )
}

// ── Bucket row ────────────────────────────────────────────────────────────────
function BucketRow({ cat, data, setData }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(cat.name)
  const [emoji, setEmoji] = useState(cat.emoji)
  const [amount, setAmount] = useState(String(cat.monthlyAmount || 0))

  const save = () => {
    const val = parseFloat(amount) || 0
    setData(updateCategory(data, cat.id, { name, emoji, monthlyAmount: val }))
    setEditing(false)
  }

  const remove = () => {
    if (confirm(`Delete "${cat.name}" and all its transactions?`)) {
      setData(deleteCategory(data, cat.id))
    }
  }

  if (editing) {
    return (
      <div style={s.bucketEdit}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input value={emoji} onChange={e => setEmoji(e.target.value)}
            style={{ ...s.input, width: 56, textAlign: 'center', fontSize: 20 }} />
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Bucket name" style={{ ...s.input, flex: 1 }} />
        </div>
        <div style={s.amountRow}>
          <div style={s.amountLabel}>Monthly credit (₹)</div>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ ...s.input, width: 120, textAlign: 'right', marginBottom: 0 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={remove} style={s.deleteBtn}>Delete</button>
          <button onClick={() => setEditing(false)} style={s.cancelBtn}>Cancel</button>
          <button onClick={save} style={s.saveBtn}>Save</button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setEditing(true)} style={s.bucketRow}>
      <span style={s.bucketEmoji}>{cat.emoji}</span>
      <div style={s.bucketInfo}>
        <div style={s.bucketName}>{cat.name}</div>
        <div style={s.bucketAmount}>₹{(cat.monthlyAmount || 0).toLocaleString('en-IN')}/mo</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a3020" strokeWidth="2" strokeLinecap="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>
  )
}

// ── Add bucket ────────────────────────────────────────────────────────────────
function AddBucketRow({ data, setData }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📁')
  const [amount, setAmount] = useState('')

  const save = () => {
    if (!name.trim()) return
    setData(addCategory(data, { name: name.trim(), emoji, monthlyAmount: parseFloat(amount) || 0 }))
    setName(''); setEmoji('📁'); setAmount('')
    setAdding(false)
  }

  if (adding) {
    return (
      <div style={s.bucketEdit}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input value={emoji} onChange={e => setEmoji(e.target.value)}
            style={{ ...s.input, width: 56, textAlign: 'center', fontSize: 20 }} />
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Bucket name" style={{ ...s.input, flex: 1 }} autoFocus />
        </div>
        <div style={s.amountRow}>
          <div style={s.amountLabel}>Monthly credit (₹)</div>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ ...s.input, width: 120, textAlign: 'right', marginBottom: 0 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={() => setAdding(false)} style={s.cancelBtn}>Cancel</button>
          <button onClick={save} style={s.saveBtn}>Add Bucket</button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setAdding(true)} style={s.addBtn}>
      + Add bucket
    </button>
  )
}

// ── PIN section ───────────────────────────────────────────────────────────────
function PINSection({ data, setData }) {
  const hasPIN = !!data.settings.pinHash
  const [mode, setMode] = useState(null) // 'set' | 'change' | 'remove'
  const [step, setStep] = useState('enter') // 'enter' | 'confirm' | 'old'
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [err, setErr] = useState('')

  const reset = () => { setMode(null); setStep('enter'); setPin(''); setConfirmPin(''); setErr('') }

  const handleSet = async () => {
    if (pin.length < 6) return setErr('PIN must be 6 digits')
    if (step === 'enter') { setStep('confirm'); setConfirmPin(''); return }
    if (pin !== confirmPin) { setErr('PINs do not match'); setStep('enter'); setPin(''); return }
    const hash = await hashPIN(pin)
    setData(savePIN(data, hash))
    reset()
  }

  const handleRemove = async () => {
    const hash = await hashPIN(pin)
    if (hash !== data.settings.pinHash) return setErr('Incorrect PIN')
    setData(removePIN(data))
    reset()
  }

  if (mode === 'set' || mode === 'change') {
    return (
      <div style={s.pinBox}>
        <div style={s.pinLabel}>
          {step === 'enter' ? 'Enter new 6-digit PIN' : 'Confirm your PIN'}
        </div>
        <input
          type="password" inputMode="numeric" maxLength={6}
          value={step === 'enter' ? pin : confirmPin}
          onChange={e => step === 'enter' ? setPin(e.target.value) : setConfirmPin(e.target.value)}
          style={{ ...s.input, letterSpacing: 8, textAlign: 'center', fontSize: 20 }}
          autoFocus
        />
        {err && <div style={s.err}>{err}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={s.cancelBtn}>Cancel</button>
          <button onClick={handleSet} style={s.saveBtn}>
            {step === 'enter' ? 'Next' : 'Set PIN'}
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'remove') {
    return (
      <div style={s.pinBox}>
        <div style={s.pinLabel}>Enter current PIN to remove</div>
        <input
          type="password" inputMode="numeric" maxLength={6}
          value={pin} onChange={e => setPin(e.target.value)}
          style={{ ...s.input, letterSpacing: 8, textAlign: 'center', fontSize: 20 }}
          autoFocus
        />
        {err && <div style={s.err}>{err}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={s.cancelBtn}>Cancel</button>
          <button onClick={handleRemove} style={{ ...s.saveBtn, background: '#ef4444' }}>Remove PIN</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.pinRow}>
      <div>
        <div style={s.rowLabel}>PIN protection</div>
        <div style={s.rowSub}>{hasPIN ? 'PIN is set' : 'No PIN set'}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {hasPIN ? (
          <>
            <button onClick={() => setMode('change')} style={s.pinBtn}>Change</button>
            <button onClick={() => setMode('remove')} style={{ ...s.pinBtn, color: '#ef4444', borderColor: '#ef4444' }}>Remove</button>
          </>
        ) : (
          <button onClick={() => setMode('set')} style={s.pinBtn}>Set PIN</button>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  root: {
    minHeight: '100dvh', background: '#0a0800', color: '#f1f1f3',
    fontFamily: "'Inter', system-ui, sans-serif",
    paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '52px 16px 16px', borderBottom: '1px solid #1a1500',
  },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: 700, color: '#f1f1f3' },
  body: { padding: '16px' },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 11, color: '#6b5a30', fontWeight: 600,
    letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12,
  },
  row: {
    background: '#130f00', border: '1px solid #2a2010', borderRadius: 12,
    padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  rowLabel: { fontSize: 14, color: '#f1f1f3', fontWeight: 500 },
  rowSub: { fontSize: 12, color: '#6b5a30', marginTop: 2 },
  dayBtn: {
    background: '#0a0800', border: '1px solid #2a2010', borderRadius: 8,
    padding: '8px 16px', color: '#6b5a30', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  dayBtnActive: { background: '#2a2010', color: '#fde047', borderColor: '#ca8a04' },
  bucketRow: {
    background: '#130f00', border: '1px solid #2a2010', borderRadius: 12,
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', marginBottom: 8, cursor: 'pointer', textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
  },
  bucketEmoji: { fontSize: 22, width: 36, textAlign: 'center' },
  bucketInfo: { flex: 1 },
  bucketName: { fontSize: 14, fontWeight: 600, color: '#f1f1f3' },
  bucketAmount: { fontSize: 12, color: '#6b5a30', marginTop: 2 },
  bucketEdit: {
    background: '#130f00', border: '1px solid #ca8a04', borderRadius: 12,
    padding: '14px', marginBottom: 8,
  },
  amountRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 13, color: '#6b5a30' },
  input: {
    background: '#0a0800', border: '1px solid #2a2010', borderRadius: 8,
    padding: '10px 12px', color: '#f1f1f3', fontSize: 14,
    boxSizing: 'border-box', outline: 'none', marginBottom: 0,
    fontFamily: "'Inter', system-ui, sans-serif", width: '100%',
  },
  addBtn: {
    width: '100%', background: 'transparent', border: '1px dashed #2a2010',
    borderRadius: 12, padding: '14px', color: '#6b5a30', fontSize: 14,
    fontWeight: 600, cursor: 'pointer', marginTop: 4,
  },
  saveBtn: {
    flex: 1, background: '#ca8a04', color: '#0a0800', border: 'none',
    borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  cancelBtn: {
    flex: 1, background: '#1a1500', color: '#6b5a30', border: '1px solid #2a2010',
    borderRadius: 8, padding: '10px', fontSize: 14, cursor: 'pointer',
  },
  deleteBtn: {
    background: 'transparent', color: '#ef4444', border: '1px solid #ef4444',
    borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer',
  },
  pinBox: { background: '#130f00', border: '1px solid #2a2010', borderRadius: 12, padding: '16px' },
  pinRow: {
    background: '#130f00', border: '1px solid #2a2010', borderRadius: 12,
    padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  pinLabel: { fontSize: 13, color: '#6b5a30', marginBottom: 10 },
  pinBtn: {
    background: '#0a0800', border: '1px solid #ca8a04', borderRadius: 8,
    padding: '8px 14px', color: '#ca8a04', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  err: { fontSize: 12, color: '#ef4444', marginBottom: 10 },
}

// ── Data Section ──────────────────────────────────────────────────────────────
function DataSection({ data, setData }) {
  const [importState, setImportState] = useState(null)
  // importState: null | { imported, importedIsNewer, currentDateStr, importedDateStr }

  const handleExport = () => exportData(data)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (!validateBackup(parsed)) {
          alert('Invalid backup file. Please select a valid Arpanam backup.')
          return
        }
        const resolution = resolveImport(data, parsed)
        setImportState({ imported: parsed, ...resolution })
      } catch {
        alert('Could not read file. Make sure it is a valid JSON backup.')
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const confirmImport = (force = false) => {
    if (!importState) return
    const { imported, importedIsNewer } = importState
    if (importedIsNewer || force) {
      setData(saveData(imported))
      setImportState(null)
      alert('Data imported successfully.')
    }
  }

  return (
    <div>
      {/* Export */}
      <button onClick={handleExport} style={s.dataBtn}>
        <span style={s.dataBtnIcon}>📤</span>
        <div>
          <div style={s.dataBtnLabel}>Export data</div>
          <div style={s.dataBtnSub}>Download a backup JSON file</div>
        </div>
      </button>

      {/* Import */}
      <label style={s.dataBtn}>
        <span style={s.dataBtnIcon}>📥</span>
        <div>
          <div style={s.dataBtnLabel}>Import data</div>
          <div style={s.dataBtnSub}>Restore from a backup JSON file</div>
        </div>
        <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
      </label>

      {/* Conflict resolution dialog */}
      {importState && (
        <div style={s.importDialog}>
          <div style={s.importTitle}>Confirm Import</div>

          <div style={s.importRow}>
            <div style={s.importRowLabel}>Your current data</div>
            <div style={s.importRowDate}>{importState.currentDateStr}</div>
          </div>
          <div style={s.importRow}>
            <div style={s.importRowLabel}>Backup file date</div>
            <div style={s.importRowDate}>{importState.importedDateStr}</div>
          </div>

          {importState.importedIsNewer ? (
            <div style={s.importNote}>
              ✓ Backup is newer — safe to import.
            </div>
          ) : (
            <div style={{ ...s.importNote, color: '#f97316' }}>
              ⚠ Your current data is newer than this backup. Importing will overwrite more recent data.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => setImportState(null)} style={s.cancelBtn}>Cancel</button>
            {importState.importedIsNewer ? (
              <button onClick={() => confirmImport(false)} style={s.saveBtn}>Import</button>
            ) : (
              <button onClick={() => confirmImport(true)} style={{ ...s.saveBtn, background: '#f97316' }}>
                Force Import
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Append data styles to s object — injected separately to avoid rewriting the whole styles block
Object.assign(s, {
  dataBtn: {
    width: '100%', background: '#130f00', border: '1px solid #2a2010',
    borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center',
    gap: 14, marginBottom: 8, cursor: 'pointer', textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
  },
  dataBtnIcon: { fontSize: 22, flexShrink: 0 },
  dataBtnLabel: { fontSize: 14, fontWeight: 600, color: '#f1f1f3', marginBottom: 2 },
  dataBtnSub: { fontSize: 12, color: '#6b5a30' },
  importDialog: {
    background: '#1a1000', border: '1px solid #ca8a04',
    borderRadius: 12, padding: '16px', marginTop: 8,
  },
  importTitle: { fontSize: 14, fontWeight: 700, color: '#fde047', marginBottom: 12 },
  importRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  importRowLabel: { fontSize: 12, color: '#6b5a30' },
  importRowDate: { fontSize: 12, color: '#f1f1f3', fontWeight: 600 },
  importNote: { fontSize: 12, color: '#4ade80', marginTop: 8, lineHeight: 1.5 },
})
