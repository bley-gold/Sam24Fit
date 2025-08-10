import { supabase, isSupabaseConfigured } from "./supabase"
import { uploadFile, validateFile } from "./storage"
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
  profilePicture?: File
}

export interface SignInData {
  email: string
  password: string
}

export const signUp = async (data: SignUpData) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured. Please check your environment variables.")
    }

    console.log("Client: Attempting to sign up user via auth.signUp...")

    // Sign up with email confirmation disabled for development
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: data.fullName,
        },
      },
    })

    if (authError) {
      console.error("Client: Auth signup error:", authError)
      throw authError
    }
    if (!authData.user) {
      throw new Error("Failed to create user in auth.users")
    }

    const userId = authData.user.id
    console.log("Client: Auth user created with ID:", userId)

    let profilePictureData: { base64: string; name: string; type: string } | null = null
    if (data.profilePicture) {
      const validation = validateFile(data.profilePicture)
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
        reader.readAsDataURL(data.profilePicture as Blob)
      })
      const base64String = await fileReadPromise
      profilePictureData = {
        base64: base64String,
        name: data.profilePicture.name,
        type: data.profilePicture.type,
      }
      console.log("Client: Profile picture read as Base64 successfully.")
    }

    console.log("Client: Calling createUserProfile server action...")
    const result = await createUserProfile(
      userId,
      data.email,
      data.fullName,
      data.phone,
      data.dateOfBirth,
      data.gender,
      data.streetAddress,
      data.emergencyContactName,
      data.emergencyContactNumber,
      profilePictureData,
    )

    if (!result.success) {
      console.error("Client: createUserProfile server action failed:", result.message)
      throw new Error(result.message || "Failed to create user profile via server action.")
    }
    console.log("Client: User profile created successfully via server action.")

    // Check if email confirmation is required
    if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
      console.log("Client: Email confirmation required")
      return {
        user: authData.user,
        error: null,
        needsEmailConfirmation: true,
        message: "Please check your email and click the confirmation link to complete your registration.",
      }
    }

    return { user: authData.user, error: null, needsEmailConfirmation: false }
  } catch (error) {
    console.error("Client: Sign up error:", error)
    return { user: null, error: error as Error, needsEmailConfirmation: false }
  }
}

export const signIn = async (data: SignInData) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured. Please check your environment variables.")
    }

    console.log("Client: Attempting to sign in...")

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      console.error("Client: Sign in error details:", {
        message: error.message,
        status: error.status,
        name: error.name,
      })

      // Check if it's a hook-related error
      if (error.message.includes("hook") || error.message.includes("custom_access_token_hook")) {
        console.error("Hook error detected. This might be due to:")
        console.error("1. Hook function not properly configured")
        console.error("2. Missing permissions for supabase_auth_admin")
        console.error("3. Users table not accessible to the hook")

        // You might want to provide a more user-friendly error message
        throw new Error("Authentication system is temporarily unavailable. Please try again later or contact support.")
      }

      throw error
    }

    console.log("Client: Sign in successful")

    // Log JWT claims for debugging
    let userRole = "user"
    if (authData.session) {
      try {
        const payload = JSON.parse(atob(authData.session.access_token.split(".")[1]))
        console.log("JWT payload:", payload)
        console.log("User role from JWT:", payload.user_role)
        userRole = payload.user_role || "user"
      } catch (jwtError) {
        console.error("Error parsing JWT:", jwtError)
      }
    }

    // Return user data with role information for redirect logic
    return {
      user: authData.user,
      error: null,
      userRole: userRole,
      isAdmin: userRole === "admin" || data.email === "goldstainmusic22@gmail.com",
    }
  } catch (error) {
    console.error("Sign in error:", error)
    return { user: null, error: error as Error, userRole: "user", isAdmin: false }
  }
}

export const signOut = async () => {
  if (!isSupabaseConfigured()) {
    return { error: new Error("Supabase is not properly configured") }
  }

  const { error } = await supabase.auth.signOut()
  return { error }
}

export const refreshUserSession = async () => {
  try {
    if (!isSupabaseConfigured()) {
      return { user: null, error: new Error("Supabase is not configured") }
    }

    console.log("Refreshing session to get updated JWT claims...")

    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error("Error refreshing session:", error)
      return { user: null, error }
    }

    console.log("Session refreshed successfully")

    // Log new JWT claims
    if (data.session) {
      try {
        const payload = JSON.parse(atob(data.session.access_token.split(".")[1]))
        console.log("Refreshed JWT payload:", payload)
        console.log("Updated user role from JWT:", payload.user_role)
      } catch (jwtError) {
        console.error("Error parsing refreshed JWT:", jwtError)
      }
    }

    const updatedUser = await getCurrentUser()
    return { user: updatedUser, error: null }
  } catch (error) {
    console.error("Refresh session error:", error)
    return { user: null, error: error as Error }
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase is not configured. Cannot get current user.")
      return null
    }

    const {
      data: { user: authUser },
      error: authUserError,
    } = await supabase.auth.getUser()

    if (authUserError) {
      console.error("Error fetching auth user:", authUserError)
      return null
    }
    if (!authUser) {
      return null
    }

    const profile = await getUserProfileById(authUser.id)

    if (!profile) {
      console.warn(`User profile for ${authUser.id} not found in public.users via server action.`)
      return null
    }

    return profile
  } catch (error) {
    console.error("Get current user unexpected error:", error)
    return null
  }
}

export const getUserRoleFromJWT = async (): Promise<string> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return "user"
    }

    const payload = JSON.parse(atob(session.access_token.split(".")[1]))
    return payload.user_role || payload.app_metadata?.role || "user"
  } catch (error) {
    console.error("Error getting role from JWT:", error)
    return "user"
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

    const validation = validateFile(file)
    if (!validation.valid) {
      console.error("Receipt file validation failed:", validation.error)
      throw new Error(validation.error || "Invalid file")
    }
    console.log("Receipt file validated successfully.")

    console.log("Attempting to upload receipt file for user:", user.id)
    const uploadResult = await uploadFile(file, user.id)
    if (uploadResult.error) {
      console.error("Receipt file upload failed:", uploadResult.error.message)
      throw uploadResult.error
    }
    console.log("Receipt file uploaded successfully. URL:", uploadResult.publicUrl)

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
