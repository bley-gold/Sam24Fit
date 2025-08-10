"use server"

import { createClient } from "@supabase/supabase-js"

export async function testDatabaseConnection() {
  try {
    console.log("Server Action: Testing database connection...")
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return { 
        success: false, 
        message: "Environment variables not configured",
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceRoleKey
        }
      }
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Test basic connection
    console.log("Server Action: Testing basic query...")
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("count(*)")
      .limit(1)

    if (error) {
      console.error("Server Action: Database connection error:", error)
      return { 
        success: false, 
        message: `Database error: ${error.message}`,
        details: error
      }
    }

    console.log("Server Action: Database connection successful")
    return { 
      success: true, 
      message: "Database connection successful",
      details: { userCount: data }
    }
  } catch (error) {
    console.error("Server Action: Unexpected error testing database:", error)
    return { 
      success: false, 
      message: `Unexpected error: ${(error as Error).message}`,
      details: error
    }
  }
}
