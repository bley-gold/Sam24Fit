"use server"

import { createClient } from "@supabase/supabase-js"

export async function deleteReceipt(receiptId: string, userId: string): Promise<{ success: boolean; message: string }> {
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

    console.log(`Server Action: Attempting to delete receipt ${receiptId} by user ${userId}`)

    // First, get the receipt to verify ownership and get file details
    const { data: receipt, error: fetchError } = await supabaseAdmin
      .from("receipts")
      .select("*")
      .eq("id", receiptId)
      .single()

    if (fetchError || !receipt) {
      console.error("Server Action: Error fetching receipt for deletion:", fetchError?.message)
      return { success: false, message: "Receipt not found" }
    }

    // Get the user's role to determine if they can delete this receipt
    const { data: user, error: userError } = await supabaseAdmin.from("users").select("role").eq("id", userId).single()

    if (userError || !user) {
      console.error("Server Action: Error fetching user for receipt deletion:", userError?.message)
      return { success: false, message: "User not found" }
    }

    // Check permissions: users can only delete their own receipts, admins can delete any
    if (user.role !== "admin" && receipt.user_id !== userId) {
      console.error("Server Action: User does not have permission to delete this receipt")
      return { success: false, message: "You don't have permission to delete this receipt" }
    }

    // If receipt is verified, we need to also delete the associated payment record
    if (receipt.status === "verified") {
      const { error: paymentDeleteError } = await supabaseAdmin.from("payments").delete().eq("receipt_id", receiptId)

      if (paymentDeleteError) {
        console.error("Server Action: Error deleting associated payment record:", paymentDeleteError.message)
        return { success: false, message: "Failed to delete associated payment record" }
      }
    }

    // Delete the receipt from database
    const { error: deleteError } = await supabaseAdmin.from("receipts").delete().eq("id", receiptId)

    if (deleteError) {
      console.error("Server Action: Error deleting receipt from database:", deleteError.message)
      return { success: false, message: deleteError.message }
    }

    // Optionally, delete the file from storage
    // Note: We'll keep the file in storage for now to avoid breaking other references
    // but in a production environment, you might want to implement file cleanup

    console.log(`Server Action: Successfully deleted receipt ${receiptId}`)
    return { success: true, message: "Receipt deleted successfully" }
  } catch (error) {
    console.error("Server Action: deleteReceipt unexpected error:", error)
    return { success: false, message: "An unexpected error occurred" }
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

    console.log(`Server Action: Admin ${adminId} attempting to delete receipt ${receiptId}`)

    // Verify admin permissions
    const { data: admin, error: adminError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", adminId)
      .single()

    if (adminError || !admin || admin.role !== "admin") {
      console.error("Server Action: User is not authorized to delete receipts as admin")
      return { success: false, message: "Admin privileges required" }
    }

    // Get the receipt details
    const { data: receipt, error: fetchError } = await supabaseAdmin
      .from("receipts")
      .select("*")
      .eq("id", receiptId)
      .single()

    if (fetchError || !receipt) {
      console.error("Server Action: Error fetching receipt for admin deletion:", fetchError?.message)
      return { success: false, message: "Receipt not found" }
    }

    // If receipt is verified, delete associated payment record
    if (receipt.status === "verified") {
      const { error: paymentDeleteError } = await supabaseAdmin.from("payments").delete().eq("receipt_id", receiptId)

      if (paymentDeleteError) {
        console.error("Server Action: Error deleting associated payment record:", paymentDeleteError.message)
        return { success: false, message: "Failed to delete associated payment record" }
      }
    }

    // Delete the receipt
    const { error: deleteError } = await supabaseAdmin.from("receipts").delete().eq("id", receiptId)

    if (deleteError) {
      console.error("Server Action: Error deleting receipt:", deleteError.message)
      return { success: false, message: deleteError.message }
    }

    console.log(`Server Action: Admin successfully deleted receipt ${receiptId}`)
    return { success: true, message: "Receipt deleted successfully" }
  } catch (error) {
    console.error("Server Action: deleteReceiptAdmin unexpected error:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
