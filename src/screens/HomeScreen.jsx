import { getCategories, getAllBalances, getTotalBalance, fmt } from '../store'

export default function HomeScreen({ data, setData, onNavigate, onClearCache, sync }) {
  const categories = getCategories(data)
  const balances = getAllBalances(data)
  const total = getTotalBalance(data)

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.headerTitle}>Arpanam</div>
          <div style={s.headerSub}>Purposeful giving</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {sync?.user && (
            <div style={{ fontSize: 11, color: sync.syncing ? '#ca8a04' : '#4ade80' }}>
              {sync.syncing ? '↻' : '☁'}
            </div>
          )}
          <button onClick={() => onNavigate('settings')} style={s.settingsBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        </div>
      </div>

      {/* Total */}
      <div style={s.totalCard}>
        <div style={s.totalLabel}>Total across all buckets</div>
        <div style={s.totalAmount}>{fmt(total)}</div>
        <div style={s.totalSub}>{categories.length} categories</div>
      </div>

      {/* Categories */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Your buckets</div>
        <div style={s.list}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => onNavigate('category', { categoryId: cat.id })} style={s.card}>
              <div style={s.cardLeft}>
                <div style={s.emoji}>{cat.emoji}</div>
                <div>
                  <div style={s.catName}>{cat.name}</div>
                  <div style={s.catSub}>₹{cat.monthlyAmount?.toLocaleString('en-IN') || 0}/mo</div>
                </div>
              </div>
              <div style={s.cardRight}>
                <div style={{
                  ...s.balance,
                  color: balances[cat.id] >= 0 ? '#ca8a04' : '#ef4444'
                }}>{fmt(balances[cat.id] ?? 0)}</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a3020" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>
          ))}
        </div>

        {categories.length === 0 && (
          <div style={s.empty}>No buckets yet — add one in Settings.</div>
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <button onClick={onClearCache} style={s.cacheBtn}>Clear cache & refresh</button>
      </div>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100dvh', background: '#0a0800', color: '#f1f1f3',
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex', flexDirection: 'column',
    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '56px 20px 20px', borderBottom: '1px solid #1a1500',
  },
  headerTitle: { fontSize: 22, fontWeight: 800, color: '#fde047', letterSpacing: '-0.3px' },
  headerSub: { fontSize: 11, color: '#6b5a30', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 },
  settingsBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 8 },
  totalCard: {
    margin: '16px', background: '#130f00', border: '1px solid #2a2010',
    borderRadius: 16, padding: '20px 22px',
  },
  totalLabel: { fontSize: 12, color: '#6b5a30', marginBottom: 6, fontWeight: 500 },
  totalAmount: { fontSize: 32, fontWeight: 800, color: '#fde047', letterSpacing: '-0.5px', marginBottom: 4 },
  totalSub: { fontSize: 11, color: '#3a3020', fontWeight: 500 },
  section: { padding: '0 16px', flex: 1 },
  sectionTitle: {
    fontSize: 11, color: '#6b5a30', fontWeight: 600,
    letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: {
    background: '#130f00', border: '1px solid #2a2010', borderRadius: 14,
    padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', cursor: 'pointer', width: '100%', textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
  },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  emoji: {
    fontSize: 22, width: 42, height: 42, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#1a1500', borderRadius: 10, flexShrink: 0,
  },
  catName: { fontSize: 15, fontWeight: 600, color: '#f1f1f3' },
  catSub: { fontSize: 11, color: '#6b5a30', marginTop: 2 },
  cardRight: { display: 'flex', alignItems: 'center', gap: 6 },
  balance: { fontSize: 15, fontWeight: 700 },
  empty: { fontSize: 13, color: '#3a3020', textAlign: 'center', padding: '32px 0' },
  footer: { padding: '24px 16px 0', display: 'flex', justifyContent: 'center' },
  cacheBtn: {
    background: 'transparent', color: '#3a3020', border: '1px solid #2a2010',
    borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer',
  },
}
