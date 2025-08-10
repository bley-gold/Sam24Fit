"use server"

export async function testEnvironmentVariables() {
  console.log("--- Test Environment Variables Server Action ---")
  console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log(
    "SUPABASE_SERVICE_ROLE_KEY:",
    process.env.SUPABASE_SERVICE_ROLE_KEY ? "****** (present)" : "undefined/missing",
  )
  console.log("--- End Test Environment Variables Server Action ---")

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, message: "Environment variables are NOT configured in this server action." }
  }
  return { success: true, message: "Environment variables are configured in this server action." }
}
