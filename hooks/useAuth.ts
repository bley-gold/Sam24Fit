"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, type User } from "@/lib/supabase"
import { getCurrentUser, refreshUserSession } from "@/lib/auth"

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to manually refresh user data
  const refreshUser = useCallback(async () => {
    try {
      console.log("useAuth: Refreshing user data...")
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      console.log("useAuth: User data refreshed successfully. User:", currentUser)
      return currentUser
    } catch (error) {
      console.error("useAuth: Error refreshing user:", error)
      // This prevents the UI from showing logged out state during temporary network issues
      throw error // Re-throw to allow retry logic in calling components
    }
  }, [])

  // Function to refresh session and user data
  const refreshSession = useCallback(async () => {
    try {
      const { user: refreshedUser, error } = await refreshUserSession()
      if (!error && refreshedUser) {
        setUser(refreshedUser)
        console.log("useAuth: Session refreshed. User:", refreshedUser)
      }
      return { user: refreshedUser, error }
    } catch (error) {
      console.error("useAuth: Error refreshing session:", error)
      return { user: null, error: error as Error }
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let sessionRefreshInterval: NodeJS.Timeout
    let isInitializing = false

    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("useAuth: Loading timeout reached, setting loading to false")
        setLoading(false)
      }
    }, 30000) // 30 second timeout

    // Get initial session
    const getInitialSession = async () => {
      if (isInitializing) {
        console.log("useAuth: Already initializing, skipping...")
        return
      }

      isInitializing = true
      try {
        console.log("useAuth: Getting initial session...")
        const currentUser = await getCurrentUser()

        if (mounted) {
          setUser(currentUser)
          console.log("useAuth: Initial session loaded. User:", currentUser)
          setLoading(false)
          clearTimeout(loadingTimeout)
        }
      } catch (error) {
        console.error("useAuth: Error getting initial session:", error)
        if (mounted) {
          setUser(null)
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

              // Refresh if session expires in less than 10 minutes
              if (timeUntilExpiry < 600) {
                console.log("useAuth: Auto-refreshing session to prevent timeout")
                await refreshSession()
              }
            }
          } catch (error) {
            console.error("useAuth: Error in auto session refresh:", error)
          }
        },
        10 * 60 * 1000,
      ) // Check every 10 minutes
    }

    const handleVisibilityChange = async () => {
      if (!document.hidden && mounted) {
        console.log("useAuth: Tab became visible, checking session...")
        try {
          // Use getSession instead of getCurrentUser to avoid timeout issues
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession()

          if (error) {
            console.error("useAuth: Error getting session on tab focus:", error)
            return // Don't logout on session check error
          }

          if (session) {
            console.log("useAuth: Valid session found after tab focus")
            // Only refresh user data if we don't have a user or if it's been a while
            if (!user) {
              try {
                // Use a shorter timeout for tab focus refresh
                const timeoutPromise = new Promise<null>((resolve) => {
                  setTimeout(() => resolve(null), 3000) // 3 second timeout
                })

                const getUserPromise = getCurrentUser()
                const currentUser = await Promise.race([getUserPromise, timeoutPromise])

                if (currentUser && mounted) {
                  setUser(currentUser)
                  console.log("useAuth: User data refreshed after tab focus")
                }
              } catch (error) {
                console.error("useAuth: Error refreshing user on tab focus:", error)
                // Don't logout - just log the error
              }
            }
          } else {
            console.log("useAuth: No session found after tab focus")
            // Only logout if we're sure there's no session
            if (mounted) {
              setUser(null)
            }
          }
        } catch (error) {
          console.error("useAuth: Error checking session on tab focus:", error)
          // Don't logout on error - could be temporary network issue
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
          setUser(null)
          console.log("useAuth: User explicitly signed out")
        }
      } else if (session?.user && event !== "TOKEN_REFRESHED" && event !== "INITIAL_SESSION") {
        // Only update user on sign in or sign up, not on token refresh or initial session
        try {
          const currentUser = await getCurrentUser()
          if (mounted) {
            setUser(currentUser)
            console.log("useAuth: Auth state changed. Current user:", currentUser)
          }
        } catch (error) {
          console.error("useAuth: Error in auth state change:", error)
          // Don't set user to null on error - could be temporary
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
  }, [refreshSession]) // Remove 'user' from dependencies to prevent infinite loop

  return { user, loading, refreshUser, refreshSession }
}
