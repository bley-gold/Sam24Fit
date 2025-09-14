"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/auth?error=timeout&message=Authentication took too long")
    }, 10000) // 10 second timeout

    // For Supabase OAuth/signup callbacks, let the server handle everything
    router.replace(window.location.pathname + window.location.search)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Processing authentication...</p>
      </div>
    </div>
  )
}