"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { User } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<User | null>
  refreshSession: () => Promise<{ user: User | null; error: Error | null }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => null,
  refreshSession: async () => ({ user: null, error: null }),
})

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const authHook = useAuth()
  const { user, loading, refreshUser, refreshSession } = authHook

  // Handle page visibility changes for better session management
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Refresh session when page becomes visible again
        setTimeout(() => {
          refreshSession().catch(console.error)
        }, 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, refreshSession])
  const contextValue = {
    user,
    loading,
    refreshUser,
    refreshSession,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
