import { useState, useEffect } from 'react'
import { loadData } from './store'
import { usePIN } from './usePIN'
import LockScreen from './screens/LockScreen'
import HomeScreen from './screens/HomeScreen'

export default function App() {
  const [data, setData] = useState(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  // Load data on mount
  useEffect(() => {
    setData(loadData())
  }, [])

  // SW update detection
  useEffect(() => {
    const handler = () => setUpdateAvailable(true)
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

  const pin = usePIN(data)

  // Loading state
  if (!data) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0a0800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 24 }}>🪙</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Update banner */}
      {updateAvailable && (
        <div style={bannerStyle}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0800' }}>New version available</span>
          <button onClick={handleClearCache} style={updateBtnStyle}>Update now</button>
        </div>
      )}

      {/* Lock screen or app */}
      {!pin.unlocked ? (
        <LockScreen
          onVerify={pin.verify}
          attempts={pin.attempts}
          maxAttempts={pin.maxAttempts}
          isLockedOut={pin.isLockedOut}
          secondsLeft={pin.secondsLeft}
        />
      ) : (
        <HomeScreen
          data={data}
          setData={setData}
          onClearCache={handleClearCache}
        />
      )}
    </div>
  )
}

const bannerStyle = {
  width: '100%',
  background: '#ca8a04',
  padding: '10px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  position: 'fixed',
  top: 0,
  zIndex: 999,
}

const updateBtnStyle = {
  background: '#0a0800',
  color: '#fde047',
  border: 'none',
  borderRadius: 6,
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}
