"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { User } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
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
  const { user, loading } = useAuth()

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
