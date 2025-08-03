import { supabase, isSupabaseConfigured } from "./supabase"
import { uploadFile, validateFile } from "./storage"
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

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("Failed to create user")

    // 2. Upload profile picture if provided
    let profilePictureUrl = null
    if (data.profilePicture) {
      const validation = validateFile(data.profilePicture)
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid file")
      }

      const uploadResult = await uploadFile(data.profilePicture, authData.user.id)
      if (uploadResult.error) {
        console.warn("Profile picture upload failed:", uploadResult.error)
        // Continue without profile picture rather than failing completely
      } else {
        profilePictureUrl = uploadResult.publicUrl
      }
    }

    // 3. Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: data.email,
      full_name: data.fullName,
      phone: data.phone,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      street_address: data.streetAddress,
      emergency_contact_name: data.emergencyContactName,
      emergency_contact_number: data.emergencyContactNumber,
      profile_picture_url: profilePictureUrl,
      role: "user",
      membership_status: "active",
      joining_fee_paid: false,
    })

    if (profileError) throw profileError

    return { user: authData.user, error: null }
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
      return null
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (error) throw error
    return profile
  } catch (error) {
    console.error("Get current user error:", error)
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
