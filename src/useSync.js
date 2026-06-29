import { useState, useEffect, useCallback } from 'react'
import { onAuthChange, signInWithGoogle, signOut, pushToCloud, pullFromCloud, deleteCloudData } from './firebase'
import { saveData } from './store'

export function useSync(data, setData) {
  const [user, setUser] = useState(null)           // Firebase user
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(null)
  const [syncError, setSyncError] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Listen to auth state
  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      setAuthReady(true)

      if (firebaseUser && data) {
        // User just signed in — auto pull and resolve
        await syncOnSignIn(firebaseUser.uid, data, setData, setLastSynced, setSyncError)
      }
    })
    return () => unsub()
  }, []) // eslint-disable-line

  // Auto push whenever data changes and user is signed in
  useEffect(() => {
    if (!user || !data || !authReady) return
    const push = async () => {
      const ok = await pushToCloud(user.uid, data)
      if (ok) {
        setLastSynced(new Date())
        setSyncError(null)
      } else {
        setSyncError('Sync failed — will retry on next change')
      }
    }
    push()
  }, [data]) // eslint-disable-line

  const handleSignIn = useCallback(async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      await signInWithGoogle()
      // onAuthChange fires after this and handles pull
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setSyncError('Sign in failed. Please try again.')
      }
    } finally {
      setSyncing(false)
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
    setUser(null)
    setLastSynced(null)
  }, [])

  const handleManualSync = useCallback(async () => {
    if (!user || !data) return
    setSyncing(true)
    setSyncError(null)
    try {
      const cloudData = await pullFromCloud(user.uid)
      if (cloudData) {
        const localNewer = new Date(data.meta.lastUpdated) >= new Date(cloudData.meta.lastUpdated)
        if (!localNewer) {
          setData(saveData(cloudData))
        }
      }
      await pushToCloud(user.uid, data)
      setLastSynced(new Date())
    } catch (err) {
      setSyncError('Sync failed. Check your connection.')
    } finally {
      setSyncing(false)
    }
  }, [user, data, setData])

  const handleDeleteCloud = useCallback(async () => {
    if (!user) return
    const ok = await deleteCloudData(user.uid)
    if (ok) {
      setLastSynced(null)
      setSyncError(null)
    } else {
      setSyncError('Failed to delete cloud data. Try again.')
    }
  }, [user])

  return {
    user,
    syncing,
    lastSynced,
    syncError,
    authReady,
    handleSignIn,
    handleSignOut,
    handleManualSync,
    handleDeleteCloud,
  }
}

// ─── Sync on sign in — last write wins ───────────────────────────────────────
async function syncOnSignIn(uid, localData, setData, setLastSynced, setSyncError) {
  try {
    const cloudData = await pullFromCloud(uid)

    if (!cloudData) {
      // No cloud data yet — push local up
      await pushToCloud(uid, localData)
    } else {
      const localDate = new Date(localData.meta.lastUpdated)
      const cloudDate = new Date(cloudData.meta.lastUpdated)

      if (cloudDate > localDate) {
        // Cloud is newer — pull down
        setData(saveData(cloudData))
      } else {
        // Local is newer — push up
        await pushToCloud(uid, localData)
      }
    }
    setLastSynced(new Date())
  } catch (err) {
    setSyncError('Sync failed on sign in.')
  }
}
