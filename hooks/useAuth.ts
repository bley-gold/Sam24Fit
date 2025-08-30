"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, type User } from "@/lib/supabase"
import { getCurrentUser, refreshUserSession } from "@/lib/auth"

const USER_CACHE_KEY = "sam24fit_user_cache"
const CACHE_EXPIRY_KEY = "sam24fit_cache_expiry"
const SESSION_CACHE_KEY = "sam24fit_session_cache"
const CACHE_DURATION = 5 * 60 * 1000 // Reduced to 5 minutes for better refresh handling

const getCachedUser = (): User | null => {
  if (typeof window === "undefined") return null

  try {
    const cachedUser = localStorage.getItem(USER_CACHE_KEY)
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY)

    if (cachedUser && cacheExpiry) {
      const expiryTime = Number.parseInt(cacheExpiry, 10)
      if (Date.now() < expiryTime) {
        return JSON.parse(cachedUser)
      } else {
        // Clear expired cache
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
    } else {
      localStorage.removeItem(USER_CACHE_KEY)
      localStorage.removeItem(CACHE_EXPIRY_KEY)
      localStorage.removeItem(SESSION_CACHE_KEY)
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
      console.log("useAuth: User data refreshed successfully")
      return currentUser
    } catch (error) {
      console.error("useAuth: Error refreshing user:", error)
      // Don't clear user on refresh errors to prevent logout loops
      throw error
    }
  }, [setUserWithCache])

  const refreshSession = useCallback(async () => {
    try {
      const { user: refreshedUser, error } = await refreshUserSession()
      if (!error && refreshedUser) {
        setUserWithCache(refreshedUser)
      }
      return { user: refreshedUser, error }
    } catch (error) {
      console.error("useAuth: Error refreshing session:", error)
      return { user: null, error: error as Error }
    }
  }, [setUserWithCache])

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 3

    const getInitialSession = async () => {
      try {
        // Check for cached user first for immediate UI response
        const cachedUser = getCachedUser()
        if (cachedUser && mounted && isSessionValid()) {
          console.log("useAuth: Using cached user data")
          setUser(cachedUser)
          setProfileStatus("available")
          setLoading(false)
          return
        }

        console.log("useAuth: Checking for active session...")
        
        const checkSession = async (): Promise<void> => {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error("useAuth: Error getting session:", error)
            if (retryCount < maxRetries) {
              retryCount++
              console.log(`useAuth: Retrying session check (${retryCount}/${maxRetries})...`)
              setTimeout(() => checkSession(), 1000 * retryCount)
              return
            }
            setUserWithCache(null)
            setLoading(false)
            return
          }

          if (session && mounted) {
            console.log("useAuth: Active session found, fetching user profile...")
            setProfileStatus("loading")
            const currentUser = await getCurrentUser()
            if (currentUser && mounted) {
              setUserWithCache(currentUser)
            } else if (mounted) {
              setProfileStatus("unavailable")
            }
          } else if (mounted) {
            console.log("useAuth: No active session found")
            setUserWithCache(null)
          }
          
          if (mounted) {
            setLoading(false)
          }
        }
        
        await checkSession()
      } catch (error) {
        console.error("useAuth: Error in initial session setup:", error)
        if (mounted) {
          // Don't clear user data on errors to prevent refresh issues
          setUserWithCache(null)
          setLoading(false)
        }
      }
    }

    // Auth state change handler
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("useAuth: Auth state change:", event)

      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        console.log("useAuth: User signed out or session lost")
        setUserWithCache(null)
      } else if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        try {
          console.log("useAuth: User signed in or token refreshed, fetching profile...")
          setProfileStatus("loading")
          const currentUser = await getCurrentUser()
          if (currentUser && mounted) {
            setUserWithCache(currentUser)
          } else if (mounted) {
            setProfileStatus("unavailable")
          }
        } catch (error) {
          console.error("useAuth: Error in auth state change:", error)
          // Don't clear user on profile fetch errors
        }
      }

      if (mounted) {
        setLoading(false)
      }
    })

    // Initialize session
    getInitialSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [refreshSession, setUserWithCache])

  return { user, loading, profileStatus, refreshUser, refreshSession }
}