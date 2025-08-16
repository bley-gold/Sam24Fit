"use server"
import { revalidatePath } from "next/cache"

export async function createReview(userId: string, reviewText: string, rating: number) {
  try {
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
      is_approved: false,
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
      .eq("is_approved", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(10)

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
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

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
      .or("status.eq.pending,is_approved.eq.false")
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

export async function updateReviewStatus(reviewId: string, approved: boolean) {
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const updateData = {
      is_approved: approved,
      status: approved ? "approved" : "rejected",
      updated_at: new Date().toISOString(),
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
      .eq("is_approved", true)
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
          is_featured: review.is_featured,
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

export async function toggleReviewFeatured(reviewId: string, featured: boolean) {
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error } = await serviceClient
      .from("reviews")
      .update({ is_featured: featured, updated_at: new Date().toISOString() })
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
  is_approved?: boolean
  is_featured?: boolean
}
