"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, type User } from "@/lib/supabase"
import { getCurrentUser, refreshUserSession } from "@/lib/auth"

const USER_CACHE_KEY = "sam24fit_user_cache"
const CACHE_EXPIRY_KEY = "sam24fit_cache_expiry"
const SESSION_CACHE_KEY = "sam24fit_session_cache"
const CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 hours (was 2 hours)

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

  const setUserWithCache = useCallback((newUser: User | null) => {
    setUser(newUser)
    setCachedUser(newUser)
  }, [])

  // Function to manually refresh user data
  const refreshUser = useCallback(async () => {
    try {
      console.log("useAuth: Refreshing user data...")
      const currentUser = await getCurrentUser()
      setUserWithCache(currentUser)
      console.log("useAuth: User data refreshed successfully. User:", currentUser)
      return currentUser
    } catch (error) {
      console.error("useAuth: Error refreshing user:", error)
      if (!isSessionValid()) {
        setUserWithCache(null)
      }
      throw error
    }
  }, [setUserWithCache])

  // Function to refresh session and user data
  const refreshSession = useCallback(async () => {
    try {
      const { user: refreshedUser, error } = await refreshUserSession()
      if (!error && refreshedUser) {
        setUserWithCache(refreshedUser)
        console.log("useAuth: Session refreshed. User:", refreshedUser)
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
    }, 15000) // Extended loading timeout from 10 to 15 seconds

    // Get initial session
    const getInitialSession = async () => {
      if (isInitializing) {
        console.log("useAuth: Already initializing, skipping...")
        return
      }

      isInitializing = true
      try {
        console.log("useAuth: Getting initial session...")

        const cachedUser = getCachedUser()
        if (cachedUser && mounted && isSessionValid()) {
          setUser(cachedUser)
          console.log("useAuth: Using cached user while verifying session")
          setLoading(false)
          clearTimeout(loadingTimeout)
        }

        const currentUser = await getCurrentUser()

        if (mounted) {
          setUserWithCache(currentUser)
          console.log("useAuth: Initial session loaded. User:", currentUser)
          setLoading(false)
          clearTimeout(loadingTimeout)
        }
      } catch (error) {
        console.error("useAuth: Error getting initial session:", error)
        if (mounted) {
          const cachedUser = getCachedUser()
          if (!cachedUser || !isSessionValid()) {
            setUserWithCache(null)
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
      ) // Keep session refresh check at 5 minutes for better reliability
    }

    const handleVisibilityChange = async () => {
      if (!document.hidden && mounted) {
        console.log("useAuth: Tab became visible, checking session...")
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession()

          if (error) {
            console.error("useAuth: Error getting session on tab focus:", error)
            if (!isSessionValid()) {
              setUserWithCache(null)
            }
            return
          }

          if (session) {
            console.log("useAuth: Valid session found after tab focus")
            if (!user || !isSessionValid()) {
              try {
                const timeoutPromise = new Promise<null>((resolve) => {
                  setTimeout(() => resolve(null), 8000) // Extended timeout from 5 to 8 seconds
                })

                const getUserPromise = getCurrentUser()
                const currentUser = await Promise.race([getUserPromise, timeoutPromise])

                if (currentUser && mounted) {
                  setUserWithCache(currentUser)
                  console.log("useAuth: User data refreshed after tab focus")
                }
              } catch (error) {
                console.error("useAuth: Error refreshing user on tab focus:", error)
              }
            }
          } else {
            console.log("useAuth: No session found after tab focus")
            setUserWithCache(null)
          }
        } catch (error) {
          console.error("useAuth: Error checking session on tab focus:", error)
        }
      }
    }

    getInitialSession()
    setupSessionRefresh()

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("useAuth: Auth state change event:", event, "Session:", session)

      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        if (mounted) {
          setUserWithCache(null)
          console.log("useAuth: User explicitly signed out")
        }
      } else if (session?.user && event !== "TOKEN_REFRESHED" && event !== "INITIAL_SESSION") {
        try {
          const currentUser = await getCurrentUser()
          if (mounted) {
            setUserWithCache(currentUser)
            console.log("useAuth: Auth state changed. Current user:", currentUser)
          }
        } catch (error) {
          console.error("useAuth: Error in auth state change:", error)
        }
      }

      if (mounted) {
        setLoading(false)
        clearTimeout(loadingTimeout)
        console.log("useAuth: Loading state set to false.")
      }
    })

    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
      if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      subscription.unsubscribe()
    }
  }, [refreshSession, setUserWithCache, user])

  return { user, loading, refreshUser, refreshSession }
}
