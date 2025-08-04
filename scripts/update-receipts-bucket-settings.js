import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv" // Import dotenv

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" })

// Ensure these environment variables are available in your Node.js environment
// For local execution, you might need to load them from .env.local
// For Vercel, they are automatically available in serverless functions/builds.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Error: Supabase URL or Service Role Key is not configured. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file.",
  )
  process.exit(1) // Exit if critical environment variables are missing
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function updateReceiptsBucketSettings() {
  console.log("Attempting to update 'receipts' bucket settings...")

  // IMPORTANT: Keeping 'public: true' to ensure existing receipt display functionality works.
  // If you set 'public: false', you MUST implement Supabase Signed URLs to access files.
  const { data, error } = await supabaseAdmin.storage.updateBucket("receipts", {
    public: true, // Keep as true for current app functionality
    allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
  })

  if (error) {
    console.error("Error updating 'receipts' bucket:", error.message)
    console.error("Details:", error.details)
    console.error("Hint:", error.hint)
  } else {
    console.log("Successfully updated 'receipts' bucket settings:", data)
    console.log("Allowed MIME types are now: image/jpeg, image/png, application/pdf")
    console.log("The bucket remains public for direct URL access to receipts.")
  }
}

// Execute the function
updateReceiptsBucketSettings()
