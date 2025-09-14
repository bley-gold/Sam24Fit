import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get("token") // Changed from code to token
  const code = searchParams.get("code") // Keep this for backward compatibility
  const error = searchParams.get("error")
  const errorCode = searchParams.get("error_code")
  const errorDescription = searchParams.get("error_description")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/auth"

  console.log("Auth callback received:", { token, code, error, type })

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

  // Use either token or code (Supabase uses token in email links)
  const authCode = token || code;

  if (authCode) {
    try {
      console.log("Exchanging auth code for session...")
      
      // For token-based verification (email links), we need to use verifyOtp instead
      if (token && type === "recovery") {
        const { error: verifyError, data } = await supabase.auth.verifyOtp({
          token_hash: authCode,
          type: 'recovery'
        })
        
        if (!verifyError) {
          console.log("Password recovery successful")
          return NextResponse.redirect(
            `${origin}/dashboard?recovery=true&message=Password reset successful! Welcome back.`,
          )
        } else {
          console.error("OTP verification error:", verifyError)
          return NextResponse.redirect(`${origin}/auth?error=session_error&message=Failed to verify reset token`)
        }
      } else {
        // For OAuth flows that use code parameter
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)
        
        if (!exchangeError) {
          console.log(`Auth callback success: redirecting to ${origin}${next}`)

          if (type === "signup") {
            return NextResponse.redirect(
              `${origin}/auth?confirmed=true&message=Email confirmed successfully! You can now log in.`,
            )
          }

          return NextResponse.redirect(`${origin}${next}`)
        } else {
          console.error("Session exchange error:", exchangeError)
          return NextResponse.redirect(`${origin}/auth?error=session_error&message=Failed to establish session`)
        }
      }
    } catch (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(`${origin}/auth?error=callback_error&message=Authentication callback failed`)
    }
  }

  console.error("No auth code provided in callback")
  return NextResponse.redirect(`${origin}/auth?error=callback_error&message=No authorization code provided`)
}