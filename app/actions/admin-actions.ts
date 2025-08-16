"use server"

import { createClient } from "@supabase/supabase-js"
import type { User, Receipt } from "@/lib/supabase"

export async function getAllUserProfiles(): Promise<User[] | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Server Action: Supabase URL or Service Role Key is not configured.")
      return null
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Server Action: Fetching all user profiles with service role...")
    const { data: profiles, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Server Action: Error fetching all user profiles with service role:", error.message)
      return null
    }

    console.log(`Server Action: Successfully fetched ${profiles?.length || 0} user profiles.`)
    return profiles
  } catch (error) {
    console.error("Server Action: getAllUserProfiles unexpected error:", error)
    return null
  }
}

export async function getAdminStats(): Promise<{
  totalUsers: number
  activeMembers: number
  pendingReceipts: number
  totalRevenue: number
  unpaidMembers: number
} | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Server Action: Supabase URL or Service Role Key is not configured.")
      return null
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Server Action: Fetching admin stats...")

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })

    if (usersError) {
      console.error("Server Action: Error fetching total users count:", usersError.message)
      return null
    }

    // Get active members count
    const { count: activeMembers, error: activeMembersError } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("membership_status", "active")

    if (activeMembersError) {
      console.error("Server Action: Error fetching active members count:", activeMembersError.message)
      return null
    }

    // Get pending receipts count
    const { count: pendingReceipts, error: pendingReceiptsError } = await supabaseAdmin
      .from("receipts")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    if (pendingReceiptsError) {
      console.error("Server Action: Error fetching pending receipts count:", pendingReceiptsError.message)
      return null
    }

    // Get total verified revenue using RPC function
    const { data: totalRevenueData, error: totalRevenueError } = await supabaseAdmin.rpc("get_total_verified_revenue")

    if (totalRevenueError) {
      console.error("Server Action: Error fetching total verified revenue:", totalRevenueError.message)
      return null
    }

    // Get unpaid members count for current month
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const { data: unpaidMembersData, error: unpaidMembersError } = await supabaseAdmin.rpc(
      "get_unpaid_members_current_month",
      { p_month_year: currentMonth },
    )

    if (unpaidMembersError) {
      console.error("Server Action: Error fetching unpaid members:", unpaidMembersError.message)
      return null
    }

    const unpaidMembers = unpaidMembersData?.length || 0

    const stats = {
      totalUsers: totalUsers || 0,
      activeMembers: activeMembers || 0,
      pendingReceipts: pendingReceipts || 0,
      totalRevenue: totalRevenueData || 0,
      unpaidMembers,
    }

    console.log("Server Action: Successfully fetched admin stats:", stats)
    return stats
  } catch (error) {
    console.error("Server Action: getAdminStats unexpected error:", error)
    return null
  }
}

export async function getReceiptsByMonth(): Promise<{ [key: string]: Receipt[] } | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Server Action: Supabase URL or Service Role Key is not configured.")
      return null
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
      },
    })

    console.log("Server Action: Fetching receipts grouped by month...")
    const { data: receipts, error } = await supabaseAdmin
      .from("receipts")
      .select(`
        *,
        users!receipts_user_id_fkey (
          id,
          full_name,
          email,
          profile_picture_url
        )
      `)
      .order("upload_date", { ascending: false })

    if (error) {
      console.error("Server Action: Error fetching receipts by month:", error.message)
      return null
    }

    // Group receipts by month
    const receiptsByMonth: { [key: string]: Receipt[] } = {}

    receipts?.forEach((receipt) => {
      const uploadDate = new Date(receipt.upload_date)
      const monthKey = `${uploadDate.getFullYear()}-${String(uploadDate.getMonth() + 1).padStart(2, "0")}`

      if (!receiptsByMonth[monthKey]) {
        receiptsByMonth[monthKey] = []
      }

      receiptsByMonth[monthKey].push(receipt)
    })

    console.log(`Server Action: Successfully grouped ${receipts?.length || 0} receipts by month.`)
    return receiptsByMonth
  } catch (error) {
    console.error("Server Action: getReceiptsByMonth unexpected error:", error)
    return null
  }
}

export async function getPaidMembersCurrentMonth(): Promise<(User & { paid_amount: number })[] | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Server Action: Supabase URL or Service Role Key is not configured.")
      return null
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get current month-year in YYYY-MM format
    const now = new Date()
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    console.log("Server Action: Fetching paid members for current month:", currentMonthYear)
    const { data: paidMembers, error } = await supabaseAdmin.rpc("get_paid_members_current_month", {
      p_month_year: currentMonthYear,
    })

    if (error) {
      console.error("Server Action: Error fetching paid members:", error.message, error.details, error.hint, error.code)
      return null
    }

    console.log(`Server Action: Successfully fetched ${paidMembers?.length || 0} paid members for current month.`)
    return paidMembers
  } catch (error) {
    console.error("Server Action: getPaidMembersCurrentMonth unexpected error:", error)
    return null
  }
}

export async function getUnpaidMembersCurrentMonth(): Promise<User[] | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Server Action: Supabase URL or Service Role Key is not configured.")
      return null
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get current month-year in YYYY-MM format
    const now = new Date()
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    console.log("Server Action: Fetching unpaid members for current month:", currentMonthYear)
    const { data: unpaidMembers, error } = await supabaseAdmin.rpc("get_unpaid_members_current_month", {
      p_month_year: currentMonthYear,
    })

    if (error) {
      console.error(
        "Server Action: Error fetching unpaid members:",
        error.message,
        error.details,
        error.hint,
        error.code,
      )
      return null
    }

    console.log(`Server Action: Successfully fetched ${unpaidMembers?.length || 0} unpaid members for current month.`)
    return unpaidMembers
  } catch (error) {
    console.error("Server Action: getUnpaidMembersCurrentMonth unexpected error:", error)
    return null
  }
}

export async function getMembersForDeactivation(): Promise<User[] | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Server Action: Supabase URL or Service Role Key is not configured.")
      return null
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Server Action: Fetching members for deactivation...")
    const { data: membersForDeactivation, error } = await supabaseAdmin.rpc("get_members_for_deactivation", {
      num_months: 3,
    })

    if (error) {
      console.error(
        "Server Action: Error fetching members for deactivation:",
        error.message,
        error.details,
        error.hint,
        error.code,
      )
      return null
    }

    console.log(`Server Action: Successfully fetched ${membersForDeactivation?.length || 0} members for deactivation.`)
    return membersForDeactivation
  } catch (error) {
    console.error("Server Action: getMembersForDeactivation unexpected error:", error)
    return null
  }
}

export async function updateUserMembershipStatus(
  userId: string,
  newStatus: "active" | "inactive" | "suspended",
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

    console.log(`Server Action: Updating user ${userId} membership status to ${newStatus}`)

    const { error } = await supabaseAdmin
      .from("users")
      .update({
        membership_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Server Action: Error updating user membership status:", error.message)
      return { success: false, message: error.message }
    }

    console.log(`Server Action: Successfully updated user ${userId} membership status to ${newStatus}`)
    return { success: true, message: "User membership status updated successfully" }
  } catch (error) {
    console.error("Server Action: updateUserMembershipStatus unexpected error:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function getAllReceiptsForAdmin(): Promise<Receipt[] | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Server Action: Supabase URL or Service Role Key is not configured.")
      return null
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Server Action: Fetching all receipts for admin with service role...")
    const { data: receipts, error } = await supabaseAdmin
      .from("receipts")
      .select(`
        *,
        users!receipts_user_id_fkey (
          id,
          full_name,
          email,
          profile_picture_url
        )
      `)
      .order("upload_date", { ascending: false })

    if (error) {
      console.error(
        "Server Action: Error fetching all receipts for admin with service role:",
        error.message,
        error.details,
        error.hint,
        error.code,
      )
      return null
    }

    console.log(`Server Action: Successfully fetched ${receipts?.length || 0} receipts for admin.`)
    return receipts
  } catch (error) {
    console.error("Server Action: getAllReceiptsForAdmin unexpected error:", error)
    return null
  }
}

export async function updateReceiptStatusAdmin(
  receiptId: string,
  newStatus: "verified" | "rejected",
  adminId: string,
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

    console.log(`Server Action: Updating receipt ${receiptId} status to ${newStatus} by admin ${adminId}`)

    // First get the receipt to check its current status and get user_id
    const { data: receipt, error: fetchError } = await supabaseAdmin
      .from("receipts")
      .select("*")
      .eq("id", receiptId)
      .single()

    if (fetchError) {
      console.error("Server Action: Error fetching receipt:", fetchError.message)
      return { success: false, message: fetchError.message }
    }

    const updateData: any = {
      status: newStatus,
      verified_by: adminId,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === "verified") {
      updateData.verified_date = new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin.from("receipts").update(updateData).eq("id", receiptId)

    if (updateError) {
      console.error("Server Action: Error updating receipt status:", updateError.message)
      return { success: false, message: updateError.message }
    }

    // If verified, create a payment record using safe function
    if (newStatus === "verified" && receipt) {
      const { data: paymentId, error: paymentError } = await supabaseAdmin.rpc("create_payment_record", {
        p_user_id: receipt.user_id,
        p_amount: receipt.amount || 0,
        p_receipt_id: receipt.id,
        p_payment_type: "membership",
      })

      if (paymentError) {
        console.error("Server Action: Error creating payment record:", paymentError.message)
        return { success: false, message: "Receipt updated but failed to create payment record" }
      }

      const isAdminFeePayment = receipt.description?.toLowerCase().includes("admin fee")

      if (isAdminFeePayment) {
        console.log(`Server Action: Receipt contains admin fee, updating joining_fee_paid for user ${receipt.user_id}`)

        const { error: joiningFeeError } = await supabaseAdmin
          .from("users")
          .update({
            joining_fee_paid: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", receipt.user_id)

        if (joiningFeeError) {
          console.error("Server Action: Error updating joining_fee_paid:", joiningFeeError.message)
          // Don't fail the entire operation, just log the error
        } else {
          console.log(`Server Action: Successfully updated joining_fee_paid for user ${receipt.user_id}`)
        }
      }

      console.log(
        `Server Action: Successfully created payment record and updated last payment date for user ${receipt.user_id}`,
      )
    }

    console.log(`Server Action: Successfully updated receipt ${receiptId} status to ${newStatus}`)
    return { success: true, message: "Receipt status updated successfully" }
  } catch (error) {
    console.error("Server Action: updateReceiptStatusAdmin unexpected error:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function getMonthlyRevenue(): Promise<
  { month_year: string; revenue: number; payment_count: number }[] | null
> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Server Action: Supabase URL or Service Role Key is not configured.")
      return null
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Server Action: Fetching monthly revenue...")
    const { data: monthlyRevenue, error } = await supabaseAdmin.rpc("get_monthly_revenue")

    if (error) {
      console.error("Server Action: Error fetching monthly revenue:", error.message)
      return null
    }

    console.log(`Server Action: Successfully fetched monthly revenue data for ${monthlyRevenue?.length || 0} months.`)
    return monthlyRevenue
  } catch (error) {
    console.error("Server Action: getMonthlyRevenue unexpected error:", error)
    return null
  }
}

export async function cleanupOldReceipts(): Promise<{ success: boolean; message: string; deletedCount?: number }> {
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

    console.log("Server Action: Starting cleanup of old receipts...")

    // Call the cleanup function
    const { error } = await supabaseAdmin.rpc("cleanup_old_receipts")

    if (error) {
      console.error("Server Action: Error during receipt cleanup:", error.message)
      return { success: false, message: error.message }
    }

    console.log("Server Action: Successfully completed receipt cleanup")
    return { success: true, message: "Old receipts cleanup completed successfully" }
  } catch (error) {
    console.error("Server Action: cleanupOldReceipts unexpected error:", error)
    return { success: false, message: "An unexpected error occurred during cleanup" }
  }
}

export async function deleteReceiptAdmin(
  receiptId: string,
  adminId: string,
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

    console.log(`Server Action: Deleting receipt ${receiptId} by admin ${adminId}`)

    // First get the receipt to check if it's verified (has associated payment)
    const { data: receipt, error: fetchError } = await supabaseAdmin
      .from("receipts")
      .select("*")
      .eq("id", receiptId)
      .single()

    if (fetchError) {
      console.error("Server Action: Error fetching receipt:", fetchError.message)
      return { success: false, message: fetchError.message }
    }

    // If receipt is verified, delete associated payment record first
    if (receipt.status === "verified") {
      const { error: paymentDeleteError } = await supabaseAdmin.from("payments").delete().eq("receipt_id", receiptId)

      if (paymentDeleteError) {
        console.error("Server Action: Error deleting payment record:", paymentDeleteError.message)
        return { success: false, message: "Failed to delete associated payment record" }
      }
    }

    // Delete the receipt
    const { error: deleteError } = await supabaseAdmin.from("receipts").delete().eq("id", receiptId)

    if (deleteError) {
      console.error("Server Action: Error deleting receipt:", deleteError.message)
      return { success: false, message: deleteError.message }
    }

    console.log(`Server Action: Successfully deleted receipt ${receiptId}`)
    return { success: true, message: "Receipt deleted successfully" }
  } catch (error) {
    console.error("Server Action: deleteReceiptAdmin unexpected error:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
