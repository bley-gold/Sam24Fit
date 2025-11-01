import { supabase, isSupabaseConfigured } from "./supabase";

// ------------------- HELPERS -------------------

// Convert Base64 string to Blob (browser-safe)
const base64ToBlob = (base64: string): Blob => {
  const [metadata, base64Data] = base64.split(',');
  const mime = metadata.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const byteString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: mime });
};

// ------------------- VALIDATION -------------------

export const validateFile = (file: File | string) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

  if (typeof file === "string") {
    const mimeMatch = file.match(/^data:(.*?);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "";

    if (!allowedTypes.includes(mimeType)) {
      return { valid: false, error: "Only JPG, PNG, and PDF files are allowed" };
    }

    const base64Length = file.split(",")[1].length;
    const sizeInBytes = (base64Length * 3) / 4;
    if (sizeInBytes > maxSize) {
      return { valid: false, error: "File size must be less than 10MB" };
    }
  } else {
    if (file.size > maxSize) return { valid: false, error: "File size must be less than 10MB" };
    if (!allowedTypes.includes(file.type)) return { valid: false, error: "Only JPG, PNG, and PDF files are allowed" };
  }

  return { valid: true, error: null };
};

export const validateProfilePicture = (file: File | string) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (typeof file === "string") {
    const mimeMatch = file.match(/^data:(.*?);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "";

    if (!allowedTypes.includes(mimeType)) {
      return { valid: false, error: "Only JPG and PNG files are allowed for profile pictures" };
    }

    const base64Length = file.split(",")[1].length;
    const sizeInBytes = (base64Length * 3) / 4;
    if (sizeInBytes > maxSize) {
      return { valid: false, error: "Profile picture size must be less than 5MB" };
    }
  } else {
    if (file.size > maxSize) return { valid: false, error: "Profile picture size must be less than 5MB" };
    if (!allowedTypes.includes(file.type)) return { valid: false, error: "Only JPG and PNG files are allowed for profile pictures" };
  }

  return { valid: true, error: null };
};

// ------------------- UPLOAD -------------------

export const uploadFile = async (file: File | string, userId: string) => {
  try {
    if (!isSupabaseConfigured()) throw new Error("Supabase is not properly configured");

    let uploadFile: File;
    let fileExt: string;

    if (typeof file === "string") {
      const blob = base64ToBlob(file);
      fileExt = blob.type.split("/")[1];
      uploadFile = new File([blob], `${Date.now()}.${fileExt}`, { type: blob.type });
    } else {
      fileExt = file.name.split(".").pop()!;
      uploadFile = file;
    }

    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("receipts")
      .upload(fileName, uploadFile, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(fileName);

    return { path: data.path, publicUrl: urlData.publicUrl, error: null };
  } catch (error) {
    console.error("File upload failed:", error);
    return { path: null, publicUrl: null, error: error as Error };
  }
};

export const uploadProfilePicture = async (file: File | string, userId: string) => {
  try {
    if (!isSupabaseConfigured()) throw new Error("Supabase is not properly configured");

    let uploadFile: File;
    let fileExt: string;

    if (typeof file === "string") {
      const blob = base64ToBlob(file);
      fileExt = blob.type.split("/")[1];
      uploadFile = new File([blob], `profile-${Date.now()}.${fileExt}`, { type: blob.type });
    } else {
      fileExt = file.name.split(".").pop()!;
      uploadFile = file;
    }

    const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, uploadFile, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from("profile-pictures").getPublicUrl(fileName);

    return { path: data.path, publicUrl: urlData.publicUrl, error: null };
  } catch (error) {
    console.error("Profile picture upload failed:", error);
    return { path: null, publicUrl: null, error: error as Error };
  }
};

// ------------------- DELETE -------------------

export const deleteFile = async (filePath: string) => {
  try {
    if (!isSupabaseConfigured()) throw new Error("Supabase is not properly configured");

    const { error } = await supabase.storage.from("receipts").remove([filePath]);
    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("File deletion failed:", error);
    return { error: error as Error };
  }
};

export const deleteProfilePicture = async (filePath: string) => {
  try {
    if (!isSupabaseConfigured()) throw new Error("Supabase is not properly configured");

    const { error } = await supabase.storage.from("profile-pictures").remove([filePath]);
    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("Profile picture deletion failed:", error);
    return { error: error as Error };
  }
};

// ------------------- GET PUBLIC URL -------------------

export const getFileUrl = (filePath: string) => {
  if (!isSupabaseConfigured()) return "";
  const { data } = supabase.storage.from("receipts").getPublicUrl(filePath);
  return data.publicUrl;
};

export const getProfilePictureUrl = (filePath: string) => {
  if (!isSupabaseConfigured()) return "";
  const { data } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);
  return data.publicUrl;
};
