"use server"

import { createClient } from "@supabase/supabase-js"

export async function testAuthSessionAction() {
  console.log("--- Test Auth Session Server Action ---")
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is not configured for server actions.")
    return { success: false, message: "Supabase environment variables are NOT configured." }
  }

  // Create a Supabase client that can access the session from the request headers
  // This client is specifically for server-side operations that rely on the client's JWT
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false, // Not needed for a single request
      persistSession: false,   // Not needed for a single request
    },
  })

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting user session in server action:", error.message)
      return { success: false, message: `Error getting user session: ${error.message}` }
    }

    if (user) {
      console.log("User session found in server action:")
      console.log("User ID:", user.id)
      console.log("User Email:", user.email)
      // You can also log user.app_metadata.role if it's in the JWT
      console.log("User App Metadata:", user.app_metadata)
      return { success: true, message: `User session found: ${user.email} (ID: ${user.id})` }
    } else {
      console.log("No user session found in server action.")
      return { success: false, message: "No active user session found." }
    }
  } catch (e) {
    console.error("Unexpected error in testAuthSessionAction:", e)
    return { success: false, message: `An unexpected error occurred: ${(e as Error).message}` }
  } finally {
    console.log("--- End Test Auth Session Server Action ---")
  }
}
