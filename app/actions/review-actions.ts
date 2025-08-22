"use server"
import { revalidatePath } from "next/cache"

function validateSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key || url === "undefined" || key === "undefined") {
    return false
  }

  try {
    new URL(url) // Test if URL is valid
    return true
  } catch {
    return false
  }
}

export async function canUserSubmitReview(userId: string) {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, canSubmit: false, message: "Database configuration error" }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Calculate date 3 months ago
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: recentReviews, error } = await serviceClient
      .from("reviews")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", threeMonthsAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error checking user review eligibility:", error)
      return { success: false, canSubmit: false, message: "Failed to check review eligibility" }
    }

    const canSubmit = !recentReviews || recentReviews.length === 0
    let nextSubmissionDate = null

    if (!canSubmit && recentReviews.length > 0) {
      const lastReviewDate = new Date(recentReviews[0].created_at)
      nextSubmissionDate = new Date(lastReviewDate)
      nextSubmissionDate.setMonth(nextSubmissionDate.getMonth() + 3)
    }

    return {
      success: true,
      canSubmit,
      nextSubmissionDate: nextSubmissionDate?.toISOString() || null,
      message: canSubmit ? "You can submit a review" : "You can submit another review in 3 months",
    }
  } catch (error) {
    console.error("Exception in canUserSubmitReview:", error)
    return { success: false, canSubmit: false, message: "An unexpected error occurred" }
  }
}

export async function createReview(userId: string, reviewText: string, rating: number) {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, message: "Database configuration error" }
    }

    const eligibilityCheck = await canUserSubmitReview(userId)
    if (!eligibilityCheck.success || !eligibilityCheck.canSubmit) {
      return {
        success: false,
        message: eligibilityCheck.message || "You can only submit one review every 3 months",
      }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const insertData = {
      user_id: userId,
      review_text: reviewText,
      rating: rating,
      status: "pending",
    }

    const { data, error } = await serviceClient.from("reviews").insert(insertData).select().single()

    if (error) {
      console.error("Database error:", error)
      return { success: false, message: "Failed to create review" }
    }

    revalidatePath("/")
    return { success: true, data }
  } catch (error) {
    console.error("Exception in createReview:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function getApprovedReviews() {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, data: [] }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: reviews, error: reviewsError } = await serviceClient
      .from("reviews")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError)
      return { success: false, data: [] }
    }

    if (!reviews || reviews.length === 0) {
      return { success: true, data: [] }
    }

    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const { data: userData, error: userError } = await serviceClient
          .from("users")
          .select("full_name, profile_picture_url")
          .eq("id", review.user_id)
          .single()

        return {
          id: review.id,
          review_text: review.review_text,
          rating: review.rating,
          created_at: review.created_at,
          status: review.status,
          is_featured: review.is_featured || false,
          rejection_reason: review.rejection_reason,
          users: userError ? { full_name: "Anonymous", profile_picture_url: null } : userData,
        }
      }),
    )

    return { success: true, data: reviewsWithUsers }
  } catch (error) {
    console.error("Exception in getApprovedReviews:", error)
    return { success: false, data: [] }
  }
}

export async function getUserReviews(userId: string) {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, data: [] }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await serviceClient
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching user reviews:", error)
      return { success: false, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching user reviews:", error)
    return { success: false, data: [] }
  }
}

export async function getPendingReviews() {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, data: [] }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: reviews, error: reviewsError } = await serviceClient
      .from("reviews")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (reviewsError) {
      console.error("Error fetching pending reviews:", reviewsError)
      return { success: false, data: [] }
    }

    if (!reviews || reviews.length === 0) {
      return { success: true, data: [] }
    }

    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const { data: userData, error: userError } = await serviceClient
          .from("users")
          .select("full_name, profile_picture_url")
          .eq("id", review.user_id)
          .single()

        return {
          id: review.id,
          review_text: review.review_text,
          rating: review.rating,
          created_at: review.created_at,
          status: review.status,
          is_featured: review.is_featured || false,
          rejection_reason: review.rejection_reason,
          users: userError ? { full_name: "Anonymous", profile_picture_url: null } : userData,
        }
      }),
    )

    return { success: true, data: reviewsWithUsers }
  } catch (error) {
    console.error("Exception in getPendingReviews:", error)
    return { success: false, data: [] }
  }
}

export async function updateReviewStatus(reviewId: string, approved: boolean, rejectionReason?: string) {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, error: "Database configuration error" }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const updateData: any = {
      status: approved ? "approved" : "rejected",
      updated_at: new Date().toISOString(),
    }

    if (!approved && rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    const { error } = await serviceClient.from("reviews").update(updateData).eq("id", reviewId)

    if (error) {
      console.error("Error updating review status:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Exception in updateReviewStatus:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getApprovedReviewsForAdmin() {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, data: [] }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: reviews, error: reviewsError } = await serviceClient
      .from("reviews")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    if (reviewsError) {
      console.error("Error fetching approved reviews:", reviewsError)
      return { success: false, data: [] }
    }

    if (!reviews || reviews.length === 0) {
      return { success: true, data: [] }
    }

    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const { data: userData, error: userError } = await serviceClient
          .from("users")
          .select("full_name, profile_picture_url")
          .eq("id", review.user_id)
          .single()

        return {
          id: review.id,
          review_text: review.review_text,
          rating: review.rating,
          created_at: review.created_at,
          status: review.status,
          is_featured: review.is_featured || false,
          rejection_reason: review.rejection_reason || null,
          users: userError ? { full_name: "Anonymous", profile_picture_url: null } : userData,
        }
      }),
    )

    return { success: true, data: reviewsWithUsers }
  } catch (error) {
    console.error("Exception in getApprovedReviewsForAdmin:", error)
    return { success: false, data: [] }
  }
}

export async function getAllReviews() {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, data: [] }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: reviews, error: reviewsError } = await serviceClient
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })

    if (reviewsError) {
      console.error("Error fetching all reviews:", reviewsError)
      return { success: false, data: [] }
    }

    if (!reviews || reviews.length === 0) {
      return { success: true, data: [] }
    }

    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const { data: userData, error: userError } = await serviceClient
          .from("users")
          .select("full_name, profile_picture_url")
          .eq("id", review.user_id)
          .single()

        return {
          id: review.id,
          review_text: review.review_text,
          rating: review.rating,
          created_at: review.created_at,
          status: review.status,
          is_featured: review.is_featured || false,
          rejection_reason: review.rejection_reason || null,
          users: userError ? { full_name: "Anonymous", profile_picture_url: null } : userData,
        }
      }),
    )

    return { success: true, data: reviewsWithUsers }
  } catch (error) {
    console.error("Exception in getAllReviews:", error)
    return { success: false, data: [] }
  }
}

export async function getRejectedReviews() {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, data: [] }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: reviews, error: reviewsError } = await serviceClient
      .from("reviews")
      .select("*")
      .eq("status", "rejected")
      .order("created_at", { ascending: false })

    if (reviewsError) {
      console.error("Error fetching rejected reviews:", reviewsError)
      return { success: false, data: [] }
    }

    if (!reviews || reviews.length === 0) {
      return { success: true, data: [] }
    }

    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const { data: userData, error: userError } = await serviceClient
          .from("users")
          .select("full_name, profile_picture_url")
          .eq("id", review.user_id)
          .single()

        return {
          id: review.id,
          review_text: review.review_text,
          rating: review.rating,
          created_at: review.created_at,
          status: review.status,
          is_featured: review.is_featured || false,
          rejection_reason: review.rejection_reason,
          users: userError ? { full_name: "Anonymous", profile_picture_url: null } : userData,
        }
      }),
    )

    return { success: true, data: reviewsWithUsers }
  } catch (error) {
    console.error("Exception in getRejectedReviews:", error)
    return { success: false, data: [] }
  }
}

export async function deleteReview(reviewId: string) {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, error: "Database configuration error" }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error } = await serviceClient.from("reviews").delete().eq("id", reviewId)

    if (error) {
      console.error("Error deleting review:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Exception in deleteReview:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function toggleReviewFeatured(reviewId: string, featured: boolean) {
  try {
    if (!validateSupabaseConfig()) {
      console.error("Supabase configuration is invalid or missing")
      return { success: false, error: "Database configuration error" }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    if (featured) {
      const { data: featuredReviews, error: countError } = await serviceClient
        .from("reviews")
        .select("id")
        .eq("is_featured", true)
        .eq("status", "approved")

      if (countError) {
        console.error("Error counting featured reviews:", countError)
        return { success: false, error: "Failed to check featured review limit" }
      }

      if (featuredReviews && featuredReviews.length >= 10) {
        return {
          success: false,
          error: "You can only feature up to 10 reviews at a time. Please unfeature another review first.",
          limitReached: true,
        }
      }
    }

    const { error } = await serviceClient
      .from("reviews")
      .update({
        is_featured: featured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)

    if (error) {
      console.error("Error toggling review featured status:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Exception in toggleReviewFeatured:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export type Review = {
  id: string
  user_id: string
  review_text: string
  rating: number
  status: string
  created_at: string
  updated_at?: string
  rejection_reason?: string
  is_featured?: boolean
  users?: {
    full_name: string
    profile_picture_url?: string
  }
}
