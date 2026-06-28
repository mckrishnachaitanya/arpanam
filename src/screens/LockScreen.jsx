import { useState, useEffect } from 'react'

const PIN_LENGTH = 6

export default function LockScreen({ onVerify, attempts, maxAttempts, isLockedOut, secondsLeft }) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const [checking, setChecking] = useState(false)

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (pin.length === PIN_LENGTH && !checking) {
      handleSubmit(pin)
    }
  }, [pin])

  const handleSubmit = async (value) => {
    setChecking(true)
    const ok = await onVerify(value)
    if (!ok) {
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setPin('')
        setChecking(false)
      }, 600)
    }
  }

  const handleKey = (val) => {
    if (isLockedOut || checking) return
    if (val === 'del') {
      setPin(p => p.slice(0, -1))
    } else if (pin.length < PIN_LENGTH) {
      setPin(p => p + val)
    }
  }

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ]

  return (
    <div style={s.root}>
      {/* Icon + title */}
      <div style={s.top}>
        <div style={s.iconWrap}>
          <svg width="64" height="64" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="lc" cx="45%" cy="38%" r="60%" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#fff7c2"/>
                <stop offset="30%" stopColor="#fde047"/>
                <stop offset="70%" stopColor="#ca8a04"/>
                <stop offset="100%" stopColor="#78350f"/>
              </radialGradient>
              <radialGradient id="lr" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#92400e"/>
                <stop offset="100%" stopColor="#451a03"/>
              </radialGradient>
            </defs>
            <rect width="512" height="512" fill="#0a0800" rx="115"/>
            <ellipse cx="265" cy="292" rx="142" ry="30" fill="#000" opacity="0.45"/>
            <ellipse cx="261" cy="270" rx="146" ry="146" fill="url(#lr)"/>
            <ellipse cx="256" cy="256" rx="138" ry="138" fill="url(#lc)"/>
            <ellipse cx="256" cy="256" rx="112" ry="112" stroke="#92400e" strokeWidth="6" fill="none" opacity="0.5"/>
            <text x="256" y="292" textAnchor="middle" fontSize="148" fontWeight="900" fill="#78350f" opacity="0.85" fontFamily="serif">अ</text>
          </svg>
        </div>
        <h1 style={s.title}>Arpanam</h1>
        <p style={s.subtitle}>Enter your PIN to continue</p>
      </div>

      {/* PIN dots */}
      <div style={{ ...s.dotsRow, animation: shake ? 'shake 0.5s ease' : 'none' }}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div key={i} style={{
            ...s.dot,
            background: i < pin.length ? '#fde047' : 'transparent',
            borderColor: i < pin.length ? '#fde047' : '#3a3020',
          }} />
        ))}
      </div>

      {/* Error / lockout message */}
      {isLockedOut ? (
        <p style={s.errorText}>Too many attempts. Try again in {secondsLeft}s</p>
      ) : attempts > 0 ? (
        <p style={s.errorText}>{maxAttempts - attempts} attempt{maxAttempts - attempts !== 1 ? 's' : ''} remaining</p>
      ) : (
        <p style={{ ...s.errorText, opacity: 0 }}>_</p>
      )}

      {/* Keypad */}
      <div style={s.keypad}>
        {keys.map((row, ri) => (
          <div key={ri} style={s.keyRow}>
            {row.map((key, ki) => (
              key === '' ? (
                <div key={ki} style={s.keyEmpty} />
              ) : (
                <button
                  key={ki}
                  onClick={() => handleKey(key)}
                  disabled={isLockedOut || checking}
                  style={{
                    ...s.key,
                    opacity: isLockedOut ? 0.3 : 1,
                  }}
                >
                  {key === 'del' ? (
                    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                      <path d="M8 1L1 8L8 15M1 8H21" stroke="#fde047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span style={s.keyText}>{key}</span>
                  )}
                </button>
              )
            ))}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100dvh',
    background: '#0a0800',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    padding: '40px 24px',
    paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
  },
  top: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    borderRadius: '22.5%',
    overflow: 'hidden',
    marginBottom: 4,
    boxShadow: '0 4px 24px rgba(202,138,4,0.2)',
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: '#fde047',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b5a30',
    margin: 0,
  },
  dotsRow: {
    display: 'flex',
    gap: 14,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid',
    transition: 'background 0.15s, border-color 0.15s',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    margin: 0,
    minHeight: 20,
    textAlign: 'center',
  },
  keypad: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  keyRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  key: {
    width: 78,
    height: 78,
    borderRadius: '50%',
    background: '#1a1500',
    border: '1px solid #2a2010',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.1s',
    WebkitTapHighlightColor: 'transparent',
  },
  keyEmpty: {
    width: 78,
    height: 78,
  },
  keyText: {
    fontSize: 24,
    fontWeight: 600,
    color: '#fde047',
    fontFamily: 'system-ui, sans-serif',
  },
}
