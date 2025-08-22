"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { User } from "@/lib/supabase"
import { useRouter } from "next/navigation"

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
  const { user, loading } = authHook
  const router = useRouter()

  useEffect(() => {
    if (user && user.role === "admin") {
      router.push("/admin")
    }
  }, [user, router])

  const contextValue = {
    user,
    loading,
    refreshUser: async () => null,
    refreshSession: async () => ({ user: null, error: null }),
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
