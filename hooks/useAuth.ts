"use client"

import { useState, useEffect } from "react"
import { supabase, type User } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log("useAuth: Starting to get initial session...")
      try {
        const currentUser = await getCurrentUser()
        console.log("useAuth: getCurrentUser result:", currentUser)
        setUser(currentUser)
        console.log("useAuth: User state set to:", currentUser)
      } catch (error) {
        console.error("useAuth: Error getting initial session:", error)
        setUser(null)
      } finally {
        setLoading(false)
        console.log("useAuth: Loading set to false")
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("useAuth: Auth state change event:", event, "Session:", session?.user?.id || "no session")
      
      try {
        if (session?.user) {
          console.log("useAuth: Session exists, getting current user...")
          const currentUser = await getCurrentUser()
          console.log("useAuth: Auth state changed. Current user:", currentUser)
          setUser(currentUser)
        } else {
          console.log("useAuth: No session, setting user to null")
          setUser(null)
        }
      } catch (error) {
        console.error("useAuth: Error in auth state change:", error)
        setUser(null)
      } finally {
        setLoading(false)
        console.log("useAuth: Auth state change - loading set to false")
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  console.log("useAuth: Current state - user:", user?.id || "null", "loading:", loading)
  return { user, loading }
}
