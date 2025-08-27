"use client"

import { createContext, useContext, type ReactNode } from "react"
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

  // Navigation logic should be handled in individual pages, not in the auth provider

  const contextValue = {
    user,
    loading,
    refreshUser,
    refreshSession,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
