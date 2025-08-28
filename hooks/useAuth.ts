"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, type User } from "@/lib/supabase"
import { getCurrentUser, refreshUserSession } from "@/lib/auth"

const USER_CACHE_KEY = "sam24fit_user_cache"
const CACHE_EXPIRY_KEY = "sam24fit_cache_expiry"
const SESSION_CACHE_KEY = "sam24fit_session_cache"
const CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 hours

const RETRY_CACHE_KEY = "sam24fit_retry_cache"
const MAX_RETRIES = 3
const RETRY_COOLDOWN = 5 * 60 * 1000 // 5 minutes cooldown after max retries

const getCachedUser = (): User | null => {
  if (typeof window === "undefined") return null

  try {
    const cachedUser = localStorage.getItem(USER_CACHE_KEY)
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY)

    if (cachedUser && cacheExpiry) {
      const expiryTime = Number.parseInt(cacheExpiry, 10)
      if (Date.now() < expiryTime) {
        console.log("useAuth: Using cached user data")
        return JSON.parse(cachedUser)
      } else {
        console.log("useAuth: Cache expired, clearing")
        localStorage.removeItem(USER_CACHE_KEY)
        localStorage.removeItem(CACHE_EXPIRY_KEY)
        localStorage.removeItem(SESSION_CACHE_KEY)
      }
    }
  } catch (error) {
    console.error("useAuth: Error reading cached user:", error)
    localStorage.removeItem(USER_CACHE_KEY)
    localStorage.removeItem(CACHE_EXPIRY_KEY)
    localStorage.removeItem(SESSION_CACHE_KEY)
  }

  return null
}

const setCachedUser = (user: User | null) => {
  if (typeof window === "undefined") return

  try {
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString())
      localStorage.setItem(SESSION_CACHE_KEY, Date.now().toString())
      console.log("useAuth: User data cached successfully")
    } else {
      localStorage.removeItem(USER_CACHE_KEY)
      localStorage.removeItem(CACHE_EXPIRY_KEY)
      localStorage.removeItem(SESSION_CACHE_KEY)
      console.log("useAuth: User cache cleared")
    }
  } catch (error) {
    console.error("useAuth: Error caching user:", error)
  }
}

const getRetryInfo = () => {
  if (typeof window === "undefined") return { count: 0, lastAttempt: 0 }

  try {
    const retryData = localStorage.getItem(RETRY_CACHE_KEY)
    if (retryData) {
      return JSON.parse(retryData)
    }
  } catch (error) {
    console.error("useAuth: Error reading retry cache:", error)
  }

  return { count: 0, lastAttempt: 0 }
}

const updateRetryInfo = (count: number) => {
  if (typeof window === "undefined") return

  try {
    const retryData = { count, lastAttempt: Date.now() }
    localStorage.setItem(RETRY_CACHE_KEY, JSON.stringify(retryData))
  } catch (error) {
    console.error("useAuth: Error updating retry cache:", error)
  }
}

const clearRetryInfo = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem(RETRY_CACHE_KEY)
}

const canRetry = (): boolean => {
  const retryInfo = getRetryInfo()
  const now = Date.now()

  // Reset retry count if cooldown period has passed
  if (retryInfo.count >= MAX_RETRIES && now - retryInfo.lastAttempt > RETRY_COOLDOWN) {
    clearRetryInfo()
    return true
  }

  return retryInfo.count < MAX_RETRIES
}

const isSessionValid = (): boolean => {
  if (typeof window === "undefined") return false

  try {
    const sessionCache = localStorage.getItem(SESSION_CACHE_KEY)
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY)

    if (sessionCache && cacheExpiry) {
      const expiryTime = Number.parseInt(cacheExpiry, 10)
      return Date.now() < expiryTime
    }
  } catch (error) {
    console.error("useAuth: Error checking session validity:", error)
  }

  return false
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => getCachedUser())
  const [loading, setLoading] = useState(true)
  const [profileStatus, setProfileStatus] = useState<"loading" | "available" | "unavailable">("loading")

  const setUserWithCache = useCallback((newUser: User | null) => {
    setUser(newUser)
    setCachedUser(newUser)
    setProfileStatus(newUser ? "available" : "unavailable")
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      console.log("useAuth: Refreshing user data...")
      const currentUser = await getCurrentUser()
      setUserWithCache(currentUser)
      console.log("useAuth: User data refreshed successfully. User:", currentUser)
      clearRetryInfo()
      return currentUser
    } catch (error) {
      console.error("useAuth: Error refreshing user:", error)
      if (!isSessionValid()) {
        setUserWithCache(null)
      }
      throw error
    }
  }, [setUserWithCache])

  const refreshSession = useCallback(async () => {
    try {
      const { user: refreshedUser, error } = await refreshUserSession()
      if (!error && refreshedUser) {
        setUserWithCache(refreshedUser)
        console.log("useAuth: Session refreshed. User:", refreshedUser)
        clearRetryInfo()
      }
      return { user: refreshedUser, error }
    } catch (error) {
      console.error("useAuth: Error refreshing session:", error)
      return { user: null, error: error as Error }
    }
  }, [setUserWithCache])

  useEffect(() => {
    let mounted = true
    let sessionRefreshInterval: NodeJS.Timeout
    let isInitializing = false

    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("useAuth: Loading timeout reached, setting loading to false")
        setLoading(false)
      }
    }, 65000) // Extended loading timeout to 65 seconds to accommodate 60s profile fetch

    const restoreSupabaseSession = async () => {
      try {
        console.log("useAuth: Restoring Supabase session from storage...")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("useAuth: Error restoring session:", error)
          return null
        }

        if (session) {
          console.log("useAuth: Supabase session restored successfully")
          return session
        }

        console.log("useAuth: No stored session found")
        return null
      } catch (error) {
        console.error("useAuth: Error during session restoration:", error)
        return null
      }
    }

    const getInitialSession = async () => {
      if (isInitializing) {
        console.log("useAuth: Already initializing, skipping...")
        return
      }

      isInitializing = true

      try {
        console.log("useAuth: Getting initial session...")

        const restoredSession = await restoreSupabaseSession()

        const cachedUser = getCachedUser()
        if (cachedUser && mounted && isSessionValid()) {
          setUser(cachedUser)
          setProfileStatus("available")
          console.log("useAuth: Using cached user while verifying session")
          setLoading(false)
          clearTimeout(loadingTimeout)

          if (restoredSession) {
            try {
              const currentUser = await getCurrentUser()
              if (mounted && currentUser) {
                setUserWithCache(currentUser)
                console.log("useAuth: Background profile refresh successful")
                clearRetryInfo()
              }
            } catch (error) {
              console.log("useAuth: Background profile refresh failed, keeping cached user")
            }
          }

          isInitializing = false
          return
        }

        if (restoredSession) {
          console.log("useAuth: Session found, fetching user profile...")
          setProfileStatus("loading")

          try {
            const currentUser = await getCurrentUser()

            if (mounted) {
              if (currentUser) {
                setUserWithCache(currentUser)
                console.log("useAuth: Initial session loaded with profile. User:", currentUser)
                clearRetryInfo()
              } else {
                console.log("useAuth: Profile fetch failed but keeping session alive")
                setProfileStatus("unavailable")
                setUser(null)
              }
              setLoading(false)
              clearTimeout(loadingTimeout)
            }
          } catch (error) {
            console.error("useAuth: Error getting user profile:", error)

            if (mounted) {
              console.log("useAuth: Profile fetch error but keeping session alive")
              setProfileStatus("unavailable")
              setUser(null)
              setLoading(false)
              clearTimeout(loadingTimeout)
            }
          }
        } else {
          if (mounted) {
            setUserWithCache(null)
            setProfileStatus("unavailable")
            setLoading(false)
            clearTimeout(loadingTimeout)
          }
        }
      } catch (error) {
        console.error("useAuth: Error in initial session setup:", error)

        if (mounted) {
          const cachedUser = getCachedUser()
          if (cachedUser && isSessionValid()) {
            setUser(cachedUser)
            setProfileStatus("available")
            console.log("useAuth: Using cached user due to initialization error")
          } else {
            setUserWithCache(null)
            setProfileStatus("unavailable")
          }
          setLoading(false)
          clearTimeout(loadingTimeout)
        }
      } finally {
        isInitializing = false
      }
    }

    const setupSessionRefresh = () => {
      sessionRefreshInterval = setInterval(
        async () => {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession()
            if (session) {
              const expiresAt = session.expires_at
              const now = Math.floor(Date.now() / 1000)
              const timeUntilExpiry = expiresAt - now

              if (timeUntilExpiry < 900) {
                console.log("useAuth: Auto-refreshing session to prevent timeout")
                await refreshSession()
              }
            }
          } catch (error) {
            console.error("useAuth: Error in auto session refresh:", error)
          }
        },
        5 * 60 * 1000,
      )
    }

    const handleVisibilityChange = async () => {
      if (!document.hidden && mounted) {
        console.log("useAuth: Tab became visible, checking session...")

        try {
          const restoredSession = await restoreSupabaseSession()

          if (restoredSession) {
            console.log("useAuth: Valid session found after tab focus")
            if (!user || !isSessionValid()) {
              try {
                setProfileStatus("loading")
                const currentUser = await getCurrentUser()

                if (currentUser && mounted) {
                  setUserWithCache(currentUser)
                  console.log("useAuth: User data refreshed after tab focus")
                  clearRetryInfo()
                } else if (mounted) {
                  console.log("useAuth: Profile fetch failed after tab focus, keeping session")
                  setProfileStatus("unavailable")
                }
              } catch (error) {
                console.error("useAuth: Error refreshing user on tab focus:", error)
                if (mounted) {
                  setProfileStatus("unavailable")
                }
              }
            }
          } else {
            console.log("useAuth: No session found after tab focus")
            setUserWithCache(null)
            setProfileStatus("unavailable")
          }
        } catch (error) {
          console.error("useAuth: Error checking session on tab focus:", error)
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("useAuth: Auth state change event:", event, "Session:", session)

      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        if (mounted) {
          setUserWithCache(null)
          setProfileStatus("unavailable")
          clearRetryInfo()
          console.log("useAuth: User explicitly signed out")
        }
      } else if (session?.user && event !== "TOKEN_REFRESHED" && event !== "INITIAL_SESSION") {
        try {
          setProfileStatus("loading")
          const currentUser = await getCurrentUser()
          if (mounted) {
            if (currentUser) {
              setUserWithCache(currentUser)
              console.log("useAuth: Auth state changed. Current user:", currentUser)
              clearRetryInfo()
            } else {
              console.log("useAuth: Profile fetch failed during auth state change, keeping session")
              setProfileStatus("unavailable")
            }
          }
        } catch (error) {
          console.error("useAuth: Error in auth state change:", error)
          if (mounted) {
            setProfileStatus("unavailable")
          }
        }
      }

      if (mounted) {
        setLoading(false)
        clearTimeout(loadingTimeout)
        console.log("useAuth: Loading state set to false.")
      }
    })

    getInitialSession()
    setupSessionRefresh()

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
      if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      subscription.unsubscribe()
    }
  }, [refreshSession, setUserWithCache])

  return { user, loading, profileStatus, refreshUser, refreshSession }
}
