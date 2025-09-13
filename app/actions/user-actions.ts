"use server"

import { createClient } from "@supabase/supabase-js"

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
  profilePictureData: { base64: string; name: string; type: string } | null,
  idNumber: string,
  acceptedTerms: boolean = true,
): Promise<{ success: boolean; message: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Server Action: Supabase URL or Service Role Key is not configured.")
      return { success: false, message: "Server configuration error" }
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Server Action: Creating user profile for:", userId, "with data:", {
      email,
      fullName,
      phone,
      dateOfBirth,
      gender,
      streetAddress,
      emergencyContactName,
      emergencyContactNumber,
      idNumber,
      acceptedTerms,
      hasProfilePicture: !!profilePictureData,
    })

    let profilePictureUrl: string | null = null

    // Handle profile picture upload if provided
    if (profilePictureData) {
      try {
        console.log("Server Action: Processing profile picture upload...")

        // Convert base64 to buffer
        const base64Data = profilePictureData.base64.split(",")[1]
        const buffer = Buffer.from(base64Data, "base64")

        // Create unique filename
        const fileExt = profilePictureData.name.split(".").pop()
        const fileName = `${userId}/profile-${Date.now()}.${fileExt}`

        // Upload to profile-pictures bucket
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from("profile-pictures")
          .upload(fileName, buffer, {
            contentType: profilePictureData.type,
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("Server Action: Profile picture upload error:", uploadError)
          return { success: false, message: `Profile picture upload failed: ${uploadError.message}` }
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage.from("profile-pictures").getPublicUrl(fileName)

        profilePictureUrl = urlData.publicUrl
        console.log("Server Action: Profile picture uploaded successfully:", profilePictureUrl)
      } catch (error) {
        console.error("Server Action: Error processing profile picture:", error)
        return { success: false, message: "Failed to process profile picture" }
      }
    }

    // Insert user profile into database
    const { error: insertError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email,
      full_name: fullName,
      phone,
      date_of_birth: dateOfBirth,
      gender,
      street_address: streetAddress,
      emergency_contact_name: emergencyContactName,
      emergency_contact_number: emergencyContactNumber,
      profile_picture_url: profilePictureUrl,
      id_number: idNumber,
      accepted_terms: acceptedTerms,
      role: "user",
      membership_status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Server Action: Error inserting user profile:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      })
      return { success: false, message: `Failed to create user profile: ${insertError.message}` }
    }

    console.log("Server Action: User profile created successfully for:", userId)
    return { success: true, message: "User profile created successfully" }
  } catch (error) {
    console.error("Server Action: createUserProfile unexpected error:", error)
    return { success: false, message: "An unexpected error occurred while creating user profile" }
  }
}
