import { supabase, isSupabaseConfigured } from "./supabase"
import { uploadFile, validateFile } from "./storage" // We will no longer use uploadFile for profile pictures here
import { createUserProfile } from "@/app/actions/user-actions"
import { getUserProfileById } from "@/app/actions/profile-actions"
import type { User } from "./supabase"

export interface SignUpData {
  email: string
  password: string
  fullName: string
  phone: string
  dateOfBirth: string
  gender: string
  streetAddress: string
  emergencyContactName: string
  emergencyContactNumber: string
  profilePicture?: File // Still accept File on client side
}

export interface SignInData {
  email: string
  password: string
}

export const signUp = async (data: SignUpData) => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured. Please check your environment variables.")
    }

    // 1. Create auth user (this is still client-side)
    console.log("Client: Attempting to sign up user via auth.signUp...")
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      console.error("Client: Auth signup error:", authError)
      throw authError
    }
    if (!authData.user) {
      throw new Error("Failed to create user in auth.users")
    }

    const userId = authData.user.id // Get the user ID directly from the auth signup response
    console.log("Client: Auth user created with ID:", userId)

    // 2. Prepare profile picture data for server action
    let profilePictureData: { base64: string; name: string; type: string } | null = null
    if (data.profilePicture) {
      const validation = validateFile(data.profilePicture) // Still validate on client
      if (!validation.valid) {
        console.error("Client: Profile picture validation failed:", validation.error)
        throw new Error(validation.error || "Invalid file")
      }

      console.log("Client: Reading profile picture as Base64...")
      const reader = new FileReader()
      const fileReadPromise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result)
          } else {
            reject(new Error("Failed to read file as string"))
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(data.profilePicture as Blob) // Ensure it's treated as Blob
      })
      const base64String = await fileReadPromise
      profilePictureData = {
        base64: base64String,
        name: data.profilePicture.name,
        type: data.profilePicture.type,
      }
      console.log("Client: Profile picture read as Base64 successfully.")
    } else {
      console.log("Client: No profile picture provided for signup.")
    }

    // 3. Create user profile in public.users table using the Server Action
    // This server action will also handle the profile picture upload using the service role key.
    console.log("Client: Calling createUserProfile server action...")
    const { success, message } = await createUserProfile(
      userId,
      data.email,
      data.fullName,
      data.phone,
      data.dateOfBirth,
      data.gender,
      data.streetAddress,
      data.emergencyContactName,
      data.emergencyContactNumber,
      profilePictureData, // Pass Base64 data to server action
    )

    if (!success) {
      console.error("Client: createUserProfile server action failed:", message)
      throw new Error(message || "Failed to create user profile via server action.")
    }
    console.log("Client: User profile created successfully via server action.")

    // After successful profile creation, ensure the session is properly set on the client
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError) console.error("Client: Error getting session after profile creation:", sessionError)

    return { user: authData.user, error: null } // Return the user from the initial auth signup
  } catch (error) {
    console.error("Client: Sign up error:", error)
    return { user: null, error: error as Error }
  }
}

export const signIn = async (data: SignInData) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured. Please check your environment variables.")
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) throw error

    return { user: authData.user, error: null }
  } catch (error) {
    console.error("Sign in error:", error)
    return { user: null, error: error as Error }
  }
}

export const signOut = async () => {
  if (!isSupabaseConfigured()) {
    return { error: new Error("Supabase is not properly configured") }
  }

  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase is not configured. Cannot get current user.")
      return null
    }

    const {
      data: { user: authUser }, // Renamed to authUser to avoid conflict with public.User type
      error: authUserError,
    } = await supabase.auth.getUser()

    if (authUserError) {
      console.error("Error fetching auth user:", authUserError)
      return null
    }
    if (!authUser) {
      return null // No authenticated user
    }

    // Use the server action to fetch the user's profile, bypassing RLS
    const profile = await getUserProfileById(authUser.id)

    if (!profile) {
      console.warn(`User profile for ${authUser.id} not found in public.users via server action.`)
      return null
    }

    return profile // This is the public.User type
  } catch (error) {
    console.error("Get current user unexpected error:", error)
    return null
  }
}

export const uploadReceipt = async (file: File, amount: number, description?: string) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured. Please check your environment variables.")
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      console.error("Receipt file validation failed:", validation.error)
      throw new Error(validation.error || "Invalid file")
    }
    console.log("Receipt file validated successfully.")

    // Upload file
    console.log("Attempting to upload receipt file for user:", user.id)
    const uploadResult = await uploadFile(file, user.id) // This still uses client-side uploadFile
    if (uploadResult.error) {
      console.error("Receipt file upload failed:", uploadResult.error.message)
      throw uploadResult.error
    }
    console.log("Receipt file uploaded successfully. URL:", uploadResult.publicUrl)

    // Create receipt record
    console.log("Attempting to insert receipt record into database.")
    const { data: receiptData, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        filename: file.name,
        file_url: uploadResult.publicUrl!,
        amount,
        description,
        status: "pending",
      })
      .select()
      .single()

    if (receiptError) {
      console.error("Receipt database insert failed:", receiptError.message)
      throw receiptError
    }
    console.log("Receipt record inserted successfully:", receiptData)

    return { receipt: receiptData, error: null }
  } catch (error) {
    console.error("Upload receipt error:", error)
    return { receipt: null, error: error as Error }
  }
}
