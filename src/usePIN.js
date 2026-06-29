import { useState, useEffect, useCallback } from 'react'
import { hashPIN } from './store'

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 30

export function usePIN(data) {
  // Start locked until we confirm data is loaded and has no PIN
  const [unlocked, setUnlocked] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const hasPIN = !!data?.settings?.pinHash

  // Only unlock automatically once data is loaded and no PIN is set
  useEffect(() => {
    if (data === null) return        // still loading — stay locked
    if (!hasPIN) setUnlocked(true)  // data loaded, no PIN → unlock
    // if hasPIN → stay locked, wait for user to enter PIN
  }, [data, hasPIN])

  // Countdown timer during lockout
  useEffect(() => {
    if (!lockedUntil) return
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockedUntil(null)
        setSecondsLeft(0)
        setAttempts(0)
        clearInterval(interval)
      } else {
        setSecondsLeft(remaining)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lockedUntil])

  const verify = useCallback(async (pin) => {
    if (lockedUntil && Date.now() < lockedUntil) return false

    const entered = await hashPIN(pin)
    const correct = entered === data.settings.pinHash

    if (correct) {
      setUnlocked(true)
      setAttempts(0)
      return true
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECONDS * 1000
        setLockedUntil(until)
        setSecondsLeft(LOCKOUT_SECONDS)
      }
      return false
    }
  }, [data, attempts, lockedUntil])

  const lock = useCallback(() => {
    if (hasPIN) setUnlocked(false)
  }, [hasPIN])

  return {
    unlocked,
    hasPIN,
    verify,
    lock,
    attempts,
    maxAttempts: MAX_ATTEMPTS,
    isLockedOut: !!lockedUntil && Date.now() < lockedUntil,
    secondsLeft,
  }
}
