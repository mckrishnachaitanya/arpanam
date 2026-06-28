import { getCategories, getAllBalances, getTotalBalance, fmt } from '../store'

export default function HomeScreen({ data }) {
  const categories = getCategories(data)
  const balances = getAllBalances(data)
  const total = getTotalBalance(data)
  const { splitPercent } = data.settings

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.headerTitle}>Arpanam</div>
          <div style={s.headerSub}>Purposeful giving</div>
        </div>
        <div style={s.coinSmall}>
          <svg width="36" height="36" viewBox="0 0 512 512" fill="none">
            <defs>
              <radialGradient id="hc" cx="45%" cy="38%" r="60%" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#fff7c2"/>
                <stop offset="30%" stopColor="#fde047"/>
                <stop offset="70%" stopColor="#ca8a04"/>
                <stop offset="100%" stopColor="#78350f"/>
              </radialGradient>
              <radialGradient id="hr" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#92400e"/>
                <stop offset="100%" stopColor="#451a03"/>
              </radialGradient>
            </defs>
            <rect width="512" height="512" fill="#0a0800" rx="115"/>
            <ellipse cx="261" cy="270" rx="146" ry="146" fill="url(#hr)"/>
            <ellipse cx="256" cy="256" rx="138" ry="138" fill="url(#hc)"/>
            <text x="256" y="292" textAnchor="middle" fontSize="148" fontWeight="900" fill="#78350f" opacity="0.85" fontFamily="serif">अ</text>
          </svg>
        </div>
      </div>

      {/* Total balance card */}
      <div style={s.totalCard}>
        <div style={s.totalLabel}>Total across all buckets</div>
        <div style={s.totalAmount}>{fmt(total)}</div>
        <div style={s.totalSub}>{splitPercent}% split · {categories.length} categories</div>
      </div>

      {/* Categories */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Your buckets</div>
        {categories.length === 0 ? (
          <div style={s.empty}>No categories yet. Add one to get started.</div>
        ) : (
          <div style={s.list}>
            {categories.map(cat => (
              <div key={cat.id} style={s.card}>
                <div style={s.cardLeft}>
                  <div style={s.emoji}>{cat.emoji}</div>
                  <div style={s.catName}>{cat.name}</div>
                </div>
                <div style={s.balance}>{fmt(balances[cat.id] ?? 0)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100dvh',
    background: '#0a0800',
    color: '#f1f1f3',
    fontFamily: "'Inter', system-ui, sans-serif",
    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '56px 24px 20px',
    borderBottom: '1px solid #1a1500',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#fde047',
    letterSpacing: '-0.3px',
  },
  headerSub: {
    fontSize: 11,
    color: '#6b5a30',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 600,
  },
  coinSmall: {
    borderRadius: '22.5%',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(202,138,4,0.2)',
  },
  totalCard: {
    margin: '20px 16px',
    background: '#130f00',
    border: '1px solid #2a2010',
    borderRadius: 16,
    padding: '20px 22px',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6b5a30',
    marginBottom: 6,
    fontWeight: 500,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 800,
    color: '#fde047',
    letterSpacing: '-0.5px',
    marginBottom: 6,
  },
  totalSub: {
    fontSize: 11,
    color: '#3a3020',
    fontWeight: 500,
  },
  section: {
    padding: '0 16px',
  },
  sectionTitle: {
    fontSize: 12,
    color: '#6b5a30',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  card: {
    background: '#130f00',
    border: '1px solid #2a2010',
    borderRadius: 14,
    padding: '16px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 24,
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1500',
    borderRadius: 10,
  },
  catName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#f1f1f3',
  },
  balance: {
    fontSize: 16,
    fontWeight: 700,
    color: '#ca8a04',
  },
  empty: {
    fontSize: 13,
    color: '#3a3020',
    textAlign: 'center',
    padding: '32px 0',
  },
}
