"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (hash) {
      const params = new URLSearchParams(hash)
      const error = params.get("error")
      const errorCode = params.get("error_code")
      const errorDescription = params.get("error_description")

      if (error) {
        console.error("Auth fragment error:", { error, errorCode, errorDescription })

        if (errorCode === "otp_expired") {
          router.replace(
            "/auth?error=expired_link&message=Your email confirmation link has expired. Please request a new one.",
          )
        } else {
          router.replace(`/auth?error=auth_error&message=${errorDescription || "Authentication failed"}`)
        }
        return
      }
    }

    // If no errors in fragment, let the server handle it
    router.replace(window.location.pathname + window.location.search)
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
