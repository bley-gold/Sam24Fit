import { supabase, isSupabaseConfigured } from "./supabase"

export const uploadFile = async (file: File, userId: string) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured. Please check your environment variables.")
    }

    // Create unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage.from("receipts").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Upload error:", error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(fileName)

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
      error: null,
    }
  } catch (error) {
    console.error("File upload failed:", error)
    return {
      path: null,
      publicUrl: null,
      error: error as Error,
    }
  }
}

export const uploadProfilePicture = async (file: File, userId: string) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured. Please check your environment variables.")
    }

    // Create unique filename for profile picture
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/profile-${Date.now()}.${fileExt}`

    // Upload file to profile-pictures bucket
    const { data, error } = await supabase.storage.from("profile-pictures").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Profile picture upload error:", error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("profile-pictures").getPublicUrl(fileName)

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
      error: null,
    }
  } catch (error) {
    console.error("Profile picture upload failed:", error)
    return {
      path: null,
      publicUrl: null,
      error: error as Error,
    }
  }
}

export const deleteFile = async (filePath: string) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured")
    }

    const { error } = await supabase.storage.from("receipts").remove([filePath])

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("File deletion failed:", error)
    return { error: error as Error }
  }
}

export const deleteProfilePicture = async (filePath: string) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not properly configured")
    }

    const { error } = await supabase.storage.from("profile-pictures").remove([filePath])

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Profile picture deletion failed:", error)
    return { error: error as Error }
  }
}

export const getFileUrl = (filePath: string) => {
  if (!isSupabaseConfigured()) {
    return ""
  }

  const { data } = supabase.storage.from("receipts").getPublicUrl(filePath)
  return data.publicUrl
}

export const getProfilePictureUrl = (filePath: string) => {
  if (!isSupabaseConfigured()) {
    return ""
  }

  const { data } = supabase.storage.from("profile-pictures").getPublicUrl(filePath)
  return data.publicUrl
}

// Validate file before upload
export const validateFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 10MB" }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Only JPG, PNG, and PDF files are allowed" }
  }

  return { valid: true, error: null }
}

// Validate profile picture before upload
export const validateProfilePicture = (file: File) => {
  const maxSize = 5 * 1024 * 1024 // 5MB for profile pictures
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"]

  if (file.size > maxSize) {
    return { valid: false, error: "Profile picture size must be less than 5MB" }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Only JPG and PNG files are allowed for profile pictures" }
  }

  return { valid: true, error: null }
}
