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
  profilePictureData: { base64: string; name: string; type: string } | null, // Changed to accept Base64 data
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

    let profilePictureUrl: string | null = null
    if (profilePictureData) {
      // Decode Base64 string
      const base64WithoutPrefix = profilePictureData.base64.split(",")[1]
      const fileBuffer = Buffer.from(base64WithoutPrefix, "base64")

      const fileExt = profilePictureData.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-profile.${fileExt}` // Unique filename for profile picture

      console.log("Server Action: Attempting to upload profile picture via service role...")
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("receipts") // Using the 'receipts' bucket, ensure it's public and policies allow admin writes
        .upload(fileName, fileBuffer, {
          contentType: profilePictureData.type,
          upsert: false,
        })

      if (uploadError) {
        console.error("Server Action: Profile picture upload failed with service role:", uploadError)
        // Decide whether to throw or proceed without profile picture
        // For now, we'll throw to ensure the user knows something went wrong.
        throw new Error(`Failed to upload profile picture: ${uploadError.message}`)
      }
      console.log("Server Action: Profile picture uploaded. Path:", uploadData.path)

      const { data: urlData } = supabaseAdmin.storage.from("receipts").getPublicUrl(uploadData.path)
      profilePictureUrl = urlData.publicUrl
      console.log("Server Action: Profile picture public URL:", profilePictureUrl)
    } else {
      console.log("Server Action: No profile picture data provided.")
    }

    console.log("Server Action: Attempting to insert user profile via service role...")
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
      console.error("Server Action: Error creating user profile with service role:", profileError)
      throw new Error(`Failed to create user profile: ${profileError.message}`)
    }

    return { success: true, message: "User profile created successfully." }
  } catch (error) {
    console.error("Server Action: createUserProfile unexpected error:", error)
    return { success: false, message: (error as Error).message }
  }
}
