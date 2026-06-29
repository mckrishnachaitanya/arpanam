import { useState, useEffect } from 'react'
import { loadData, runAutoCredit } from './store'
import { usePIN } from './usePIN'
import LockScreen from './screens/LockScreen'
import HomeScreen from './screens/HomeScreen'
import CategoryScreen from './screens/CategoryScreen'
import SettingsScreen from './screens/SettingsScreen'

export default function App() {
  const [data, setData] = useState(null)
  const [screen, setScreen] = useState({ name: 'home', params: {} })
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    let d = loadData()
    d = runAutoCredit(d)
    setData(d)
  }, [])

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

  const navigate = (name, params = {}) => setScreen({ name, params })

  const pin = usePIN(data)

  if (!data) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0a0800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32 }}>🪙</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#0a0800', minHeight: '100dvh' }}>
      <div style={{ position: 'fixed', inset: 0, background: '#0a0800', zIndex: -1 }} />
      {updateAvailable && (
        <div style={bannerStyle}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0800' }}>New version available</span>
          <button onClick={handleClearCache} style={updateBtnStyle}>Update now</button>
        </div>
      )}

      {!pin.unlocked ? (
        <LockScreen
          onVerify={pin.verify}
          attempts={pin.attempts}
          maxAttempts={pin.maxAttempts}
          isLockedOut={pin.isLockedOut}
          secondsLeft={pin.secondsLeft}
        />
      ) : screen.name === 'home' ? (
        <HomeScreen
          data={data} setData={setData}
          onNavigate={navigate}
          onClearCache={handleClearCache}
        />
      ) : screen.name === 'category' ? (
        <CategoryScreen
          data={data} setData={setData}
          categoryId={screen.params.categoryId}
          onBack={() => navigate('home')}
        />
      ) : screen.name === 'settings' ? (
        <SettingsScreen
          data={data} setData={setData}
          onBack={() => navigate('home')}
        />
      ) : null}
    </div>
  )
}

const bannerStyle = {
  width: '100%', background: '#ca8a04', padding: '10px 20px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 12, position: 'fixed', top: 0, zIndex: 999,
}
const updateBtnStyle = {
  background: '#0a0800', color: '#fde047', border: 'none',
  borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
}
