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
  idNumber: string
}

export interface SignInData {
  email: string
  password: string
}

const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000): Promise<any> => {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry for authentication errors (wrong credentials, etc.)
      if (
        lastError.message.includes("Invalid login credentials") ||
        lastError.message.includes("Email not confirmed") ||
        lastError.message.includes("User not found")
      ) {
        throw lastError
      }

      // Only retry for network-related errors
      const isNetworkError =
        lastError.message.includes("Failed to fetch") ||
        lastError.message.includes("NetworkError") ||
        lastError.message.includes("ERR_CONNECTION_RESET") ||
        lastError.message.includes("ERR_NETWORK") ||
        lastError.message.includes("timeout")

      if (!isNetworkError || attempt === maxRetries) {
        throw lastError
      }

      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Network error detected, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession()
    return !error
  } catch (error) {
    console.error("Supabase connection test failed:", error)
    return false
  }
}

export const signUp = async (data: SignUpData) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured. Please check your environment variables.")
    }

    console.log("Client: Attempting to sign up user via auth.signUp...")

    const redirectUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`

    // Try to sign up without email confirmation first (for development)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: data.fullName,
        },
      },
    })

    if (authError) {
      console.error("Client: Auth signup error:", authError)

      // Check if it's an email confirmation issue
      if (authError.message.includes("email") || authError.message.includes("confirmation")) {
        throw new Error(
          "Email confirmation is required but not properly configured. Please contact support or try again later.",
        )
      }

      throw authError
    }

    if (!authData.user) {
      throw new Error("Failed to create user in auth.users")
    }

    const userId = authData.user.id
    console.log("Client: Auth user created with ID:", userId)
    console.log("Client: User email confirmed:", authData.user.email_confirmed_at ? "Yes" : "No")
    console.log("Client: Session exists:", authData.session ? "Yes" : "No")

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
      data.idNumber,
    )

    if (!result.success) {
      console.error("Client: createUserProfile server action failed:", result.message)
      throw new Error(result.message || "Failed to create user profile via server action.")
    }
    console.log("Client: User profile created successfully via server action.")

    // Check if we have a session (email confirmation not required or already confirmed)
    if (authData.session) {
      console.log("Client: User has active session, signup complete")
      return {
        user: authData.user,
        error: null,
        needsEmailConfirmation: false,
        message: "Registration successful! You can now access your account.",
      }
    }

    // Check if email confirmation is required
    if (!authData.user.email_confirmed_at) {
      console.log("Client: Email confirmation required")
      return {
        user: authData.user,
        error: null,
        needsEmailConfirmation: true,
        message:
          "Please check your email and click the confirmation link to complete your registration. If you don't receive an email, check your spam folder or contact support.",
      }
    }

    return {
      user: authData.user,
      error: null,
      needsEmailConfirmation: false,
      message: "Registration successful!",
    }
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

    console.log("Testing Supabase connection...")
    const connectionOk = await testSupabaseConnection()
    if (!connectionOk) {
      throw new Error(
        "Unable to connect to authentication service. Please check your internet connection and try again.",
      )
    }

    const authResult = await retryWithBackoff(
      async () => {
        return await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
      },
      3,
      1000,
    )

    const { data: authData, error } = authResult

    if (error) {
      console.error("Client: Sign in error details:", {
        message: error.message,
        status: error.status,
        name: error.name,
      })

      // Check for specific error types
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Please check your email and click the confirmation link before signing in.")
      }

      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please check your credentials and try again.")
      }

      // Check if it's a hook-related error
      if (error.message.includes("hook") || error.message.includes("custom_access_token_hook")) {
        console.error("Hook error detected. This might be due to:")
        console.error("1. Hook function not properly configured")
        console.error("2. Missing permissions for supabase_auth_admin")
        console.error("3. Users table not accessible to the hook")

        throw new Error("Authentication system is temporarily unavailable. Please try again later or contact support.")
      }

      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("ERR_CONNECTION_RESET")
      ) {
        throw new Error(
          "Network connection error. Please check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.",
        )
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
      isAdmin: userRole === "admin",
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

export const resetPassword = async (email: string) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured. Please check your environment variables.")
    }

    console.log("Client: Attempting to send password reset email...")

    const redirectUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?type=recovery`
        : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?type=recovery`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error("Client: Password reset error:", error)
      throw error
    }

    console.log("Client: Password reset email sent successfully")
    return { error: null, message: "Password reset email sent successfully" }
  } catch (error) {
    console.error("Reset password error:", error)
    return { error: error as Error, message: null }
  }
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

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("getCurrentUser timeout")), 60000)
    })

    const getUserPromise = supabase.auth.getUser()

    const {
      data: { user: authUser },
      error: authUserError,
    } = await Promise.race([getUserPromise, timeoutPromise])

    if (authUserError) {
      console.error("Error fetching auth user:", authUserError)
      return null
    }
    if (!authUser) {
      console.log("No authenticated user found")
      return null
    }

    console.log("Auth user found:", authUser.email)

    const fetchProfileWithRetry = async (retries = 3): Promise<any> => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const profilePromise = getUserProfileById(authUser.id)
          const profileTimeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => {
              resolve(null)
            }, 60000)
          })

          const profile = await Promise.race([profilePromise, profileTimeoutPromise])

          if (profile) {
            console.log("User profile found:", profile.email)
            return profile
          }

          if (attempt < retries - 1) {
            const delay = Math.pow(2, attempt) * 1000
            console.log(`Profile fetch attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            continue
          }

          return null
        } catch (profileError) {
          console.error(`Profile fetch attempt ${attempt + 1} error:`, profileError)

          if (attempt < retries - 1) {
            const delay = Math.pow(2, attempt) * 1000
            console.log(`Retrying profile fetch in ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            continue
          }

          console.error("All profile fetch retries exhausted")
          return null
        }
      }
      return null
    }

    const profile = await fetchProfileWithRetry(3)

    if (!profile) {
      console.log("Profile fetch failed after retries, using auth user data as fallback")
      return {
        id: authUser.id,
        email: authUser.email!,
        password_hash: null,
        full_name: authUser.user_metadata?.full_name || authUser.email!,
        phone: authUser.user_metadata?.phone || "",
        date_of_birth: null,
        gender: null,
        street_address: null,
        emergency_contact_name: null,
        emergency_contact_number: null,
        profile_picture_url: null,
        membership_status: "active",
        created_at: authUser.created_at,
        updated_at: new Date().toISOString(),
        id_number: null,
        last_payment_date: null,
        accepted_terms: true,
      }
    }

    return profile
  } catch (error) {
    console.error("Get current user unexpected error:", error)
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (authUser) {
        console.log("Returning basic auth user data due to profile fetch error")
        return {
          id: authUser.id,
          email: authUser.email!,
          password_hash: null,
          full_name: authUser.user_metadata?.full_name || authUser.email!,
          phone: authUser.user_metadata?.phone || "",
          date_of_birth: null,
          gender: null,
          street_address: null,
          emergency_contact_name: null,
          emergency_contact_number: null,
          profile_picture_url: null,
          membership_status: "active",
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
          id_number: null,
          last_payment_date: null,
          accepted_terms: true,
        }
      }
    } catch (fallbackError) {
      console.error("Fallback auth user fetch also failed:", fallbackError)
    }
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

export const uploadReceipt = async (file: File, amount: number, description?: string, isAdminFee?: boolean) => {
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
