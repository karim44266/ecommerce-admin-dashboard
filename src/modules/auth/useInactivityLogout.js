import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth, isAuthenticated } from './authStorage'
import { getInactivityConfig, logout as logoutApi } from '../../services/authService'

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes fallback

/**
 * Custom hook implementing configurable inactivity auto-logout.
 * Fetches timeout from backend, resets timer on user activity.
 */
const useInactivityLogout = () => {
  const navigate = useNavigate()
  const timerRef = useRef(null)
  const timeoutMsRef = useRef(DEFAULT_TIMEOUT_MS)

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // Ignore errors during logout — we still clear local state
    }
    clearAuth()
    navigate('/login', { replace: true })
  }, [navigate])

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (isAuthenticated()) {
      timerRef.current = setTimeout(handleLogout, timeoutMsRef.current)
    }
  }, [handleLogout])

  useEffect(() => {
    if (!isAuthenticated()) return

    // Fetch inactivity config from backend
    getInactivityConfig()
      .then((config) => {
        if (config?.timeoutMinutes && config.timeoutMinutes > 0) {
          timeoutMsRef.current = config.timeoutMinutes * 60 * 1000
        }
        resetTimer()
      })
      .catch(() => {
        // Use default timeout on error
        resetTimer()
      })

    // Attach activity listeners
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true })
    })

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, resetTimer)
      })
    }
  }, [resetTimer])

  return null
}

export default useInactivityLogout
