"use server"

import { createClient } from "@supabase/supabase-js" // Import createClient here

// This action creates the user profile in the public.users table
// It uses the service_role key to bypass RLS for this specific insert,
// ensuring the profile is created reliably after auth.signUp.
export async function createUserProfile(
  userId: string,
  email: string,
  fullName: string,
  phone: string,
  dateOfBirth: string,
  gender: string,
  streetAddress: string,
  emergencyContactName: string,
  emergencyContactNumber: string,
  profilePictureUrl: string | null,
) {
  try {
    // Initialize supabaseAdmin client here, ensuring it's only done on the server
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase URL or Service Role Key is not configured for server actions.")
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email: email,
      full_name: fullName,
      phone: phone,
      date_of_birth: dateOfBirth,
      gender: gender,
      street_address: streetAddress,
      emergency_contact_name: emergencyContactName,
      emergency_contact_number: emergencyContactNumber,
      profile_picture_url: profilePictureUrl,
      role: "user",
      membership_status: "active",
      joining_fee_paid: false,
    })

    if (profileError) {
      console.error("Error creating user profile with service role:", profileError)
      throw new Error(`Failed to create user profile: ${profileError.message}`)
    }

    return { success: true, message: "User profile created successfully." }
  } catch (error) {
    console.error("Server Action: createUserProfile error:", error)
    return { success: false, message: (error as Error).message }
  }
}
