"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, type User } from "@/lib/supabase"
import { getCurrentUser, refreshUserSession } from "@/lib/auth"

const USER_CACHE_KEY = "sam24fit_user_cache"
const CACHE_EXPIRY_KEY = "sam24fit_cache_expiry"
const SESSION_CACHE_KEY = "sam24fit_session_cache"
const CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 hours

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
      }
      return { user: refreshedUser, error }
    } catch (error) {
      console.error("useAuth: Error refreshing session:", error)
      return { user: null, error: error as Error }
    }
  }, [setUserWithCache])

  useEffect(() => {
    let mounted = true
    let isInitializing = false

    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("useAuth: Loading timeout reached, setting loading to false")
        setLoading(false)
      }
    }, 10000) // Reduced timeout

    const restoreSupabaseSession = async () => {
      try {
        console.log("useAuth: Restoring Supabase session from storage...")

        console.log("Testing Supabase connection...")
        const connectionTest = await supabase.auth.getUser()
        console.log("Supabase connection test result:", connectionTest.error ? "Failed" : "Success")

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
          setLoading(false)
          clearTimeout(loadingTimeout)

          try {
            const currentUser = await getCurrentUser()

            if (mounted) {
              if (currentUser) {
                setUserWithCache(currentUser)
                console.log("useAuth: Initial session loaded with profile. User:", currentUser)
              } else {
                console.log("useAuth: Profile fetch failed but keeping session alive")
                setProfileStatus("unavailable")
                setUser(null)
              }
            }
          } catch (error) {
            console.error("useAuth: Error getting user profile:", error)

            if (mounted) {
              console.log("useAuth: Profile fetch error but keeping session alive")
              setProfileStatus("unavailable")
              setUser(null)
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

    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted && mounted) {
        console.log("useAuth: Page restored from bfcache, checking session...")

        try {
          const restoredSession = await restoreSupabaseSession()

          if (restoredSession && !isSessionValid()) {
            console.log("useAuth: Valid session found after bfcache restore")
            try {
              setProfileStatus("loading")
              const currentUser = await getCurrentUser()

              if (currentUser && mounted) {
                setUserWithCache(currentUser)
                console.log("useAuth: User data refreshed after bfcache restore")
              } else if (mounted) {
                console.log("useAuth: Profile fetch failed after bfcache restore, keeping session")
                setProfileStatus("unavailable")
              }
            } catch (error) {
              console.error("useAuth: Error refreshing user after bfcache restore:", error)
              if (mounted) {
                setProfileStatus("unavailable")
              }
            }
          }
        } catch (error) {
          console.error("useAuth: Error checking session after bfcache restore:", error)
        }
      }
    }

    const handlePageHide = () => {
      console.log("useAuth: Page being stored in bfcache, cleaning up...")
      clearTimeout(loadingTimeout)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("useAuth: Auth state change event:", event, "Session:", session)

      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        if (mounted) {
          setUserWithCache(null)
          setProfileStatus("unavailable")
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

    window.addEventListener("pageshow", handlePageShow, { passive: true })
    window.addEventListener("pagehide", handlePageHide, { passive: true })

    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
      window.removeEventListener("pageshow", handlePageShow)
      window.removeEventListener("pagehide", handlePageHide)
      subscription.unsubscribe()
    }
  }, [refreshSession, setUserWithCache])

  return { user, loading, profileStatus, refreshUser, refreshSession }
}
