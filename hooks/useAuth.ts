"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, type User } from "@/lib/supabase"
import { getCurrentUser, refreshUserSession } from "@/lib/auth"

const USER_CACHE_KEY = "sam24fit_user_cache"
const CACHE_EXPIRY_KEY = "sam24fit_cache_expiry"
const SESSION_CACHE_KEY = "sam24fit_session_cache"
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes for better balance

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
      const currentUser = await getCurrentUser()
      setUserWithCache(currentUser)
      return currentUser
    } catch (error) {
      console.error("useAuth: Error refreshing user:", error)
      
      // Try fallback auth user
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const fallbackUser: User = {
            id: authUser.id,
            email: authUser.email!,
            full_name: authUser.user_metadata?.full_name || authUser.email!,
            phone: authUser.user_metadata?.phone || "",
            date_of_birth: "",
            gender: "other",
            street_address: "",
            emergency_contact_name: "",
            emergency_contact_number: "",
            role: "user",
            membership_status: "active",
            profile_picture_url: null,
            last_payment_date: undefined,
            created_at: authUser.created_at,
            updated_at: new Date().toISOString(),
          }
          setUserWithCache(fallbackUser)
          return fallbackUser
        }
      } catch (fallbackError) {
        console.error("useAuth: Fallback user also failed:", fallbackError)
      }
      
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
    let isInitializing = false

    const restoreSupabaseSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("useAuth: Error getting session:", error)
          return null
        }

        if (session) {
          console.log("useAuth: Supabase session restored successfully")
          return session
        }

        return null
      } catch (error) {
        console.error("useAuth: Error during session restoration:", error)
        return null
      }
    }

    const getInitialSession = async () => {
      if (isInitializing) return
      isInitializing = true

      try {
        // Check for cached user first for immediate UI response
        const cachedUser = getCachedUser()
        if (cachedUser && mounted && isSessionValid()) {
          setUser(cachedUser)
          setProfileStatus("available")
          setLoading(false)
          
          // Background verification
          setTimeout(async () => {
            try {
              const session = await restoreSupabaseSession()
              if (session && mounted) {
                const currentUser = await getCurrentUser()
                if (currentUser) {
                  setUserWithCache(currentUser)
                }
              }
            } catch (error) {
              console.log("useAuth: Background verification failed, keeping cached user")
            }
          }, 100)
          
          isInitializing = false
          return
        }

        // Check for session
        const session = await restoreSupabaseSession()
        
        if (session && mounted) {
          setLoading(false)
          setProfileStatus("loading")
          
          try {
            const currentUser = await getCurrentUser()
            
            if (currentUser && mounted) {
              setUserWithCache(currentUser)
            } else if (mounted) {
              // Fallback: use auth user data if profile fetch fails
              const { data: { user: authUser } } = await supabase.auth.getUser()
              if (authUser && mounted) {
                const fallbackUser: User = {
                  id: authUser.id,
                  email: authUser.email!,
                  full_name: authUser.user_metadata?.full_name || authUser.email!,
                  phone: authUser.user_metadata?.phone || "",
                  date_of_birth: "",
                  gender: "other",
                  street_address: "",
                  emergency_contact_name: "",
                  emergency_contact_number: "",
                  role: "user",
                  membership_status: "active",
                  profile_picture_url: null,
                  last_payment_date: undefined,
                  created_at: authUser.created_at,
                  updated_at: new Date().toISOString(),
                }
                setUserWithCache(fallbackUser)
              } else {
                setProfileStatus("unavailable")
                setUser(null)
              }
            }
          } catch (error) {
            console.error("useAuth: Error getting user profile:", error)
            if (mounted) {
              // Try to get basic auth user as fallback
              try {
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (authUser && mounted) {
                  const fallbackUser: User = {
                    id: authUser.id,
                    email: authUser.email!,
                    full_name: authUser.user_metadata?.full_name || authUser.email!,
                    phone: authUser.user_metadata?.phone || "",
                    date_of_birth: "",
                    gender: "other",
                    street_address: "",
                    emergency_contact_name: "",
                    emergency_contact_number: "",
                    role: "user",
                    membership_status: "active",
                    profile_picture_url: null,
                    last_payment_date: undefined,
                    created_at: authUser.created_at,
                    updated_at: new Date().toISOString(),
                  }
                  setUserWithCache(fallbackUser)
                } else {
                  setProfileStatus("unavailable")
                  setUser(null)
                }
              } catch (fallbackError) {
                console.error("useAuth: Fallback also failed:", fallbackError)
                setProfileStatus("unavailable")
                setUser(null)
              }
            }
          }
        } else if (mounted) {
          setUserWithCache(null)
          setProfileStatus("unavailable")
          setLoading(false)
        }
      } catch (error) {
        console.error("useAuth: Error in initial session setup:", error)
        if (mounted) {
          const cachedUser = getCachedUser()
          if (cachedUser && isSessionValid()) {
            setUser(cachedUser)
            setProfileStatus("available")
          } else {
            setUserWithCache(null)
            setProfileStatus("unavailable")
          }
          setLoading(false)
        }
      } finally {
        isInitializing = false
      }
    }

    // Optimized page visibility handling for bfcache
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && mounted) {
        console.log("useAuth: Page restored from bfcache, refreshing session...")
        
        // Quick session check without blocking
        setTimeout(async () => {
          try {
            const session = await restoreSupabaseSession()
            if (session && mounted) {
              const currentUser = await getCurrentUser()
              if (currentUser) {
                setUserWithCache(currentUser)
              }
            } else if (mounted) {
              setUserWithCache(null)
            }
          } catch (error) {
            console.error("useAuth: Error in bfcache restore:", error)
          }
        }, 50)
      }
    }

    // Handle page visibility changes to maintain session
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        console.log("useAuth: Page became visible, checking session...")
        
        // Quick session validation without full refresh
        setTimeout(async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession()
            
            if (error) {
              console.error("useAuth: Session check error on visibility change:", error)
              return
            }
            
            if (session && session.user && mounted) {
              // Session exists, ensure user data is current
              if (!user || user.id !== session.user.id) {
                console.log("useAuth: Restoring user data after tab switch")
                const currentUser = await getCurrentUser()
                if (currentUser && mounted) {
                  setUserWithCache(currentUser)
                }
              }
            } else if (mounted && user) {
              // Session lost, clear user
              console.log("useAuth: Session lost during tab switch, clearing user")
              setUserWithCache(null)
            }
          } catch (error) {
            console.error("useAuth: Error checking session on visibility change:", error)
          }
        }, 100)
      }
    }

    // Handle focus events for additional session validation
    const handleFocus = () => {
      if (mounted && user) {
        // Validate session is still active when window regains focus
        setTimeout(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session && mounted) {
              console.log("useAuth: Session expired during focus, clearing user")
              setUserWithCache(null)
            }
          } catch (error) {
            console.error("useAuth: Error validating session on focus:", error)
          }
        }, 50)
      }
    }

    // Simplified auth state change handler
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("useAuth: Auth state change:", event)

      if (event === "SIGNED_OUT") {
        setUserWithCache(null)
        setProfileStatus("unavailable")
        setLoading(false)
      } else if (event === "SIGNED_IN" && session?.user) {
        try {
          setProfileStatus("loading")
          const currentUser = await getCurrentUser()
          if (currentUser && mounted) {
            setUserWithCache(currentUser)
          } else if (mounted) {
            // Use auth user as fallback
            const fallbackUser: User = {
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || session.user.email!,
              phone: session.user.user_metadata?.phone || "",
              date_of_birth: "",
              gender: "other",
              street_address: "",
              emergency_contact_name: "",
              emergency_contact_number: "",
              role: "user",
              membership_status: "active",
              profile_picture_url: null,
              last_payment_date: undefined,
              created_at: session.user.created_at,
              updated_at: new Date().toISOString(),
            }
            setUserWithCache(fallbackUser)
          }
        } catch (error) {
          console.error("useAuth: Error in auth state change:", error)
          if (mounted) {
            setProfileStatus("unavailable")
          }
        }
        setLoading(false)
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Don't refetch user data on token refresh, just update session
        console.log("useAuth: Token refreshed, keeping current user data")
        setLoading(false)
      } else if (event === "INITIAL_SESSION") {
        // Handle initial session separately
        if (session?.user && mounted) {
          try {
            setProfileStatus("loading")
            const currentUser = await getCurrentUser()
            if (currentUser) {
              setUserWithCache(currentUser)
            }
          } catch (error) {
            console.error("useAuth: Error in initial session:", error)
          }
        }
        setLoading(false)
      }
    })

    // Initialize session
    getInitialSession()

    // Add page visibility listeners for bfcache
    window.addEventListener("pageshow", handlePageShow, { passive: true })
    document.addEventListener("visibilitychange", handleVisibilityChange, { passive: true })
    window.addEventListener("focus", handleFocus, { passive: true })

    return () => {
      mounted = false
      window.removeEventListener("pageshow", handlePageShow)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
      subscription.unsubscribe()
    }
  }, [refreshSession, setUserWithCache])

  return { user, loading, profileStatus, refreshUser, refreshSession }
}