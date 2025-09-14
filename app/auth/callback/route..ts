import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorCode = searchParams.get("error_code")
  const errorDescription = searchParams.get("error_description")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? (type === "recovery" ? "/dashboard" : "/auth")

  if (error) {
    console.error("Auth callback error:", { error, errorCode, errorDescription })

    if (errorCode === "otp_expired") {
      return NextResponse.redirect(
        `${origin}/auth?error=expired_link&message=Your email confirmation link has expired. Please request a new one.`,
      )
    }

    return NextResponse.redirect(
      `${origin}/auth?error=auth_error&message=${errorDescription || "Authentication failed"}`,
    )
  }

  if (code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!exchangeError) {
        console.log(`Auth callback success: redirecting to ${origin}${next}`)

        if (type === "recovery") {
          return NextResponse.redirect(
            `${origin}/dashboard?recovery=true&message=Password reset successful! Welcome back.`,
          )
        } else if (type === "signup") {
          return NextResponse.redirect(
            `${origin}/auth?confirmed=true&message=Email confirmed successfully! You can now log in.`,
          )
        }

        // Default redirect for other types
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error("Session exchange error:", exchangeError)
        return NextResponse.redirect(`${origin}/auth?error=session_error&message=Failed to establish session`)
      }
    } catch (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(`${origin}/auth?error=callback_error&message=Authentication callback failed`)
    }
  }

  // If no code and no error, redirect to auth page
  return NextResponse.redirect(`${origin}/auth?error=callback_error&message=No authorization code provided`)
}