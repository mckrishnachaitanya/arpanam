import { useState, useEffect } from 'react'

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [swReg, setSwReg] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      setUpdateAvailable(true)
      setSwReg(e.detail)
    }
    window.addEventListener('sw-update-available', handler)
    return () => window.removeEventListener('sw-update-available', handler)
  }, [])

  const handleClearCache = async () => {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg?.active) {
        reg.active.postMessage('CLEAR_CACHE')
        navigator.serviceWorker.addEventListener('message', (e) => {
          if (e.data === 'CACHE_CLEARED') window.location.reload()
        })
      } else {
        window.location.reload()
      }
    }
  }

  return (
    <div style={styles.root}>
      {/* Update banner */}
      {updateAvailable && (
        <div style={styles.updateBanner}>
          <span style={styles.updateText}>New version available</span>
          <button onClick={handleClearCache} style={styles.updateBtn}>Update now</button>
        </div>
      )}

      {/* Splash / shell */}
      <div style={styles.shell}>
        {/* Coin icon */}
        <div style={styles.iconWrap}>
          <svg width="96" height="96" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1a1200"/>
                <stop offset="100%" stopColor="#0a0800"/>
              </linearGradient>
              <radialGradient id="coin" cx="45%" cy="38%" r="60%" gradientUnits="objectBoundingBox">
                <stop offset="0%"   stopColor="#fff7c2"/>
                <stop offset="30%"  stopColor="#fde047"/>
                <stop offset="70%"  stopColor="#ca8a04"/>
                <stop offset="100%" stopColor="#78350f"/>
              </radialGradient>
              <radialGradient id="rim" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
                <stop offset="0%"  stopColor="#92400e"/>
                <stop offset="100%" stopColor="#451a03"/>
              </radialGradient>
            </defs>
            <rect width="512" height="512" fill="url(#bg)" rx="115"/>
            <ellipse cx="265" cy="292" rx="142" ry="30" fill="#000" opacity="0.45"/>
            <ellipse cx="261" cy="270" rx="146" ry="146" fill="url(#rim)"/>
            <ellipse cx="256" cy="256" rx="138" ry="138" fill="url(#coin)"/>
            <ellipse cx="256" cy="256" rx="112" ry="112" stroke="#92400e" strokeWidth="6" fill="none" opacity="0.5"/>
            <ellipse cx="256" cy="256" rx="113" ry="113" stroke="#fef08a" strokeWidth="2" fill="none" opacity="0.3"/>
            <text x="266" y="302" textAnchor="middle" fontSize="148" fontWeight="900" fill="#78350f" opacity="0.55" fontFamily="serif">अ</text>
            <text x="252" y="288" textAnchor="middle" fontSize="148" fontWeight="900" fill="#fff7c2" opacity="0.2" fontFamily="serif">अ</text>
            <text x="256" y="292" textAnchor="middle" fontSize="148" fontWeight="900" fill="#78350f" opacity="0.85" fontFamily="serif">अ</text>
            <path d="M136 204 Q154 128 232 110" stroke="#fef9c3" strokeWidth="6" fill="none" opacity="0.2" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 style={styles.title}>Arpanam</h1>
        <p style={styles.subtitle}>Purposeful giving</p>

        <p style={styles.hint}>Coming soon — your buckets await.</p>
      </div>

      {/* Footer with clear cache -->*/}
      <div style={styles.footer}>
        <button onClick={handleClearCache} style={styles.cacheBtn}>
          Clear cache & refresh
        </button>
      </div>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100dvh',
    background: '#0a0800',
    color: '#f1f1f3',
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updateBanner: {
    width: '100%',
    background: '#ca8a04',
    color: '#0a0800',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  updateText: {
    fontSize: 13,
    fontWeight: 600,
  },
  updateBtn: {
    background: '#0a0800',
    color: '#fde047',
    border: 'none',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  shell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '40px 24px',
  },
  iconWrap: {
    borderRadius: '22.5%',
    overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(202,138,4,0.2)',
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: '-0.5px',
    color: '#fde047',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#92400e',
    margin: 0,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  hint: {
    fontSize: 13,
    color: '#3a3020',
    marginTop: 24,
  },
  footer: {
    padding: '20px 24px',
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
  },
  cacheBtn: {
    background: 'transparent',
    color: '#3a3020',
    border: '1px solid #2a2010',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 12,
    cursor: 'pointer',
  },
}
