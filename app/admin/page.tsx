"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, LogOut, FileText, Check, X, Eye, TrendingUp } from "lucide-react"
import { useAuthContext } from "@/components/auth-provider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { signOut } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface Receipt {
  id: string
  filename: string
  uploadDate: string
  status: "pending" | "verified" | "rejected"
  amount?: number // Changed to number for calculation
  description?: string
}

export default function AdminPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loadingReceipts, setLoadingReceipts] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      // Redirect if not logged in or not an admin
      router.push("/auth")
      return
    }
    if (user && user.role === "admin") {
      fetchReceipts()
    }
  }, [user, loading, router])

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase.from("receipts").select("*").order("created_at", { ascending: false }) // Admins can see all receipts

      if (error) throw error
      setReceipts(data || [])
    } catch (error) {
      console.error("Error fetching receipts:", error)
      // Optionally toast error
    } finally {
      setLoadingReceipts(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      // toast({ title: "Logged out", description: "You have been successfully logged out." });
      router.push("/")
    } catch (error) {
      // toast({ title: "Error", description: "Failed to log out.", variant: "destructive" });
      console.error("Logout error:", error)
    }
  }

  const updateReceiptStatus = async (receiptId: string, newStatus: "verified" | "rejected") => {
    try {
      const { error } = await supabase
        .from("receipts")
        .update({
          status: newStatus,
          verified_date: newStatus === "verified" ? new Date().toISOString() : null,
          verified_by: user?.id,
        })
        .eq("id", receiptId)

      if (error) throw error

      // If status is verified and amount is 120, create a payment record
      const updatedReceipt = receipts.find((r) => r.id === receiptId)
      if (newStatus === "verified" && updatedReceipt && updatedReceipt.amount === 120) {
        const { error: paymentError } = await supabase.rpc("create_payment_from_receipt", { receipt_uuid: receiptId })
        if (paymentError) {
          console.error("Error creating payment from receipt:", paymentError)
          // toast({ title: "Payment Creation Failed", description: paymentError.message, variant: "destructive" });
        } else {
          // toast({ title: "Payment Created", description: "Membership payment recorded.", variant: "success" });
        }
      }

      setReceipts((prev) =>
        prev.map((receipt) =>
          receipt.id === receiptId
            ? {
                ...receipt,
                status: newStatus,
                verified_date: newStatus === "verified" ? new Date().toISOString() : undefined,
                verified_by: user?.id,
              }
            : receipt,
        ),
      )
      // toast({ title: "Receipt Updated", description: `Receipt ${receiptId} status changed to ${newStatus}.` });
    } catch (error) {
      console.error("Error updating receipt status:", error)
      // toast({ title: "Update Failed", description: "Failed to update receipt status.", variant: "destructive" });
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  // Calculate stats dynamically
  const stats = {
    totalReceipts: receipts.length,
    pendingReceipts: receipts.filter((r) => r.status === "pending").length,
    verifiedReceipts: receipts.filter((r) => r.status === "verified").length,
    totalAmount: receipts
      .filter((r) => r.status === "verified" && r.amount)
      .reduce((sum, r) => sum + Number.parseFloat(r.amount.toString() || "0"), 0), // Ensure amount is treated as string for parseFloat
  }

  if (loading || !user) {
    // Show loading spinner if still loading or user is not yet determined
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
      </div>
    )
  }

  // If user is not admin, they will be redirected by useEffect, so this won't be reached.
  // If for some reason it is, we can show a message or redirect.
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have administrative privileges to view this page.</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Sam24Fit Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-red-100 text-red-800">Admin</Badge>
              <span className="text-sm text-gray-600">Welcome, {user.full_name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-gray-600">Manage payment receipts and member verification</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReceipts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReceipts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Check className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.verifiedReceipts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Verified</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Receipts Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Receipt Management
            </CardTitle>
            <CardDescription>Review and verify member payment receipts</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReceipts ? (
              <div className="text-center py-8">
                <LoadingSpinner size="md" text="Loading receipts..." />
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No receipts to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{receipt.filename}</p>
                          <p className="text-sm text-gray-500">Uploaded: {receipt.uploadDate}</p>
                          {receipt.description && <p className="text-sm text-gray-600 mt-1">{receipt.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {receipt.amount && (
                          <span className="font-bold text-lg text-gray-900">${receipt.amount.toFixed(2)}</span>
                        )}
                        <Badge className={getStatusColor(receipt.status)}>
                          {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    {receipt.status === "pending" && (
                      <div className="flex space-x-2 mt-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateReceiptStatus(receipt.id, "verified")}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateReceiptStatus(receipt.id, "rejected")}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
