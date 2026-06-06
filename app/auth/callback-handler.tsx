"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function CallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const finishAuthentication = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const errorDescription =
        searchParams.get("error_description") ||
        hashParams.get("error_description") ||
        searchParams.get("error") ||
        hashParams.get("error")

      if (errorDescription) {
        router.replace(`/auth?error=auth_error&message=${encodeURIComponent(errorDescription)}`)
        return
      }

      const code = searchParams.get("code")
      const isRecovery = searchParams.get("type") === "recovery"

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          router.replace(`/auth?error=session_error&message=${encodeURIComponent(error.message)}`)
          return
        }
      } else {
        // supabase-js parses legacy implicit-flow tokens from the URL hash.
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.replace(
            "/auth?error=callback_error&message=The authentication link is invalid or has expired",
          )
          return
        }
      }

      if (cancelled) return

      if (isRecovery) {
        router.replace("/auth?recovery=true")
      } else {
        router.replace(
          `/auth?confirmed=true&message=${encodeURIComponent(
            "Email confirmed successfully. You can now access your account.",
          )}`,
        )
      }
    }

    const timer = window.setTimeout(() => {
      if (!cancelled) {
        router.replace("/auth?error=timeout&message=Authentication took too long")
      }
    }, 15000)

    void finishAuthentication().finally(() => window.clearTimeout(timer))

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p>Processing authentication...</p>
      </div>
    </div>
  )
}
