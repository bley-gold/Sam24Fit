import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorCode = searchParams.get("error_code")
  const errorDescription = searchParams.get("error_description")
  const next = searchParams.get("next") ?? "/dashboard"

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
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        const forwardedHost = request.headers.get("x-forwarded-host")
        const forwardedProto = request.headers.get("x-forwarded-proto") || "https"

        if (forwardedHost) {
          return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      }
    } catch (error) {
      console.error("Auth callback error:", error)
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=callback_error&message=Authentication callback failed`)
}
