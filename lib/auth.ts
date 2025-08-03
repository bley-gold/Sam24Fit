import { supabase, isSupabaseConfigured } from "./supabase"
import { uploadFile, validateFile } from "./storage"
import { createUserProfile } from "@/app/actions/user-actions"
import { getUserProfileById } from "@/app/actions/profile-actions" // Import the new server action
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
  profilePicture?: File
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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("Failed to create user in auth.users")

    const userId = authData.user.id // Get the user ID directly from the auth signup response

    // 2. Upload profile picture if provided (still client-side)
    let profilePictureUrl = null
    if (data.profilePicture) {
      const validation = validateFile(data.profilePicture)
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid file")
      }

      const uploadResult = await uploadFile(data.profilePicture, userId)
      if (uploadResult.error) {
        console.warn("Profile picture upload failed:", uploadResult.error)
        // Continue without profile picture rather than failing completely
      } else {
        profilePictureUrl = uploadResult.publicUrl
      }
    }

    // 3. Create user profile in public.users table using the Server Action
    // This bypasses client-side RLS for the insert operation.
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
      profilePictureUrl,
    )

    if (!success) {
      throw new Error(message || "Failed to create user profile via server action.")
    }

    // After successful profile creation, ensure the session is properly set on the client
    // This might be redundant with the initial auth.signUp, but good for robustness.
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError) console.error("Error getting session after profile creation:", sessionError)

    return { user: authData.user, error: null } // Return the user from the initial auth signup
  } catch (error) {
    console.error("Sign up error:", error)
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
      throw new Error(validation.error || "Invalid file")
    }

    // Upload file
    const uploadResult = await uploadFile(file, user.id)
    if (uploadResult.error) throw uploadResult.error

    // Create receipt record
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

    if (receiptError) throw receiptError

    return { receipt: receiptData, error: null }
  } catch (error) {
    console.error("Upload receipt error:", error)
    return { receipt: null, error: error as Error }
  }
}
