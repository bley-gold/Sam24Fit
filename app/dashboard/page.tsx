"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { useAuthContext } from "@/components/auth-provider"
import { signOut, getUserRoleFromJWT } from "@/lib/auth"
import { supabase, type Receipt } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Dumbbell, Upload, FileText, LogOut, User, Calendar, CreditCard, Shield, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { deleteReceipt } from "@/app/actions/receipt-actions"

export default function Dashboard() {
  const { user, loading: authLoading, refreshUser, refreshSession } = useAuthContext()
  const router = useRouter()
  const { toast } = useToast()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loadingReceipts, setLoadingReceipts] = useState(true)
  const [jwtRole, setJwtRole] = useState<string>("")
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    console.log("DashboardPage useEffect: authLoading =", authLoading, ", user =", user)
    if (!authLoading && !user) {
      console.log("DashboardPage: User not authenticated, redirecting to auth.")
      router.push("/auth")
      return
    }

    if (user) {
      console.log("DashboardPage: User authenticated, fetching receipts.")
      fetchReceipts()
      checkJWTRole()
    }
  }, [user, authLoading, router])

  const checkJWTRole = async () => {
    const role = await getUserRoleFromJWT()
    setJwtRole(role)
    console.log("JWT Role:", role, "Database Role:", user?.role)

    // If JWT role doesn't match database role, show warning
    if (user && role !== user.role) {
      console.warn("JWT role mismatch! JWT:", role, "Database:", user.role)
    }
  }

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setReceipts(data || [])
    } catch (error) {
      console.error("Error fetching receipts:", error)
      toast({
        title: "Error",
        description: "Failed to load receipts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingReceipts(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
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

  const handleRefreshRole = async () => {
    try {
      setLoadingReceipts(true)

      // Refresh the session to get updated JWT claims
      const { user: refreshedUser, error } = await refreshSession()

      if (error) {
        await refreshUser()
      }

      // Check JWT role again
      await checkJWTRole()

      toast({
        title: "Profile Refreshed",
        description: "Your role and profile information have been updated.",
      })

      await fetchReceipts()
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh profile. Please try logging out and back in.",
        variant: "destructive",
      })
    } finally {
      setLoadingReceipts(false)
    }
  }

  const handleProfileUpdate = async () => {
    // Refresh the current user data
    await refreshUser()
  }

  const handleDeleteReceipt = async (receipt: Receipt) => {
    setReceiptToDelete(receipt)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteReceipt = async () => {
    if (!receiptToDelete || !user) return

    setIsDeleting(true)
    try {
      const { success, message } = await deleteReceipt(receiptToDelete.id, user.id)

      if (success) {
        toast({
          title: "Receipt Deleted",
          description: "Receipt has been successfully deleted.",
        })
        // Remove the receipt from local state
        setReceipts((prev) => prev.filter((r) => r.id !== receiptToDelete.id))
      } else {
        toast({
          title: "Delete Failed",
          description: message || "Failed to delete receipt.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred while deleting the receipt.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setReceiptToDelete(null)
    }
  }

  // Function to determine effective role (database role takes precedence if JWT is wrong)
  const getEffectiveRole = () => {
    return user?.role || "user"
  }

  const isAdmin = () => {
    return getEffectiveRole() === "admin"
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const effectiveRole = getEffectiveRole()
  const roleMatch = user.role === jwtRole

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Sam24Fit</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.full_name}</span>
              {isAdmin() && (
                <Badge className="bg-red-100 text-red-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {jwtRole === "admin" && <Badge className="bg-blue-100 text-blue-800">JWT: Admin</Badge>}
              {!roleMatch && <Badge className="bg-yellow-100 text-yellow-800">Role Mismatch</Badge>}
              <Button variant="ghost" size="sm" onClick={handleRefreshRole}>
                Refresh Role
              </Button>
              {isAdmin() && (
                <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
                  Admin Panel
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Manage your gym payments and receipts</p>

          {/* Role Status Debug Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Database Role:</strong> {user.role} |<strong> JWT Role:</strong> {jwtRole || "Loading..."} |
              <strong> Effective Role:</strong> {effectiveRole} |<strong> Match:</strong> {roleMatch ? "✅" : "❌"}
            </p>
            {!roleMatch && (
              <p className="text-sm text-yellow-800 mt-1">
                ⚠️ JWT role doesn't match database role. This may indicate the auth hook isn't working properly.
              </p>
            )}
          </div>

          {/* Special message for admin users with JWT issues */}
          {user.role === "admin" && jwtRole !== "admin" && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Admin Access Notice</h3>
              <p className="text-sm text-yellow-700 mb-3">
                You have admin privileges in the database, but your JWT token doesn't reflect this. You can still access
                admin features, but some functionality may be limited.
              </p>
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleRefreshRole}>
                  Refresh Session
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push("/admin")}>
                  Go to Admin Panel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Image
                    src={user.profile_picture_url || "/placeholder.svg?height=96&width=96&query=user profile"}
                    alt="Profile Picture"
                    width={96}
                    height={96}
                    className="rounded-full object-cover border-2 border-orange-500"
                  />
                  <ProfilePictureUpload user={user} onProfileUpdate={handleProfileUpdate} isAdmin={isAdmin()} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{user.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <div className="flex items-center space-x-2">
                  <Badge
                    className={effectiveRole === "admin" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}
                  >
                    {effectiveRole}
                  </Badge>
                  {jwtRole && jwtRole !== user.role && (
                    <Badge className="bg-yellow-100 text-yellow-800">JWT: {jwtRole}</Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Membership</label>
                <Badge
                  className={
                    user.membership_status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }
                >
                  {user.membership_status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Upload receipts and manage your payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button className="h-20 bg-orange-600 hover:bg-orange-700" onClick={() => router.push("/upload")}>
                  <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto mb-2" />
                    <span>Upload Receipt</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-20 bg-transparent" onClick={() => router.push("/payments")}>
                  <div className="text-center">
                    <CreditCard className="h-6 w-6 mx-auto mb-2" />
                    <span>Payment History</span>
                  </div>
                </Button>
                {isAdmin() && (
                  <Button
                    variant="outline"
                    className="h-20 bg-red-50 border-red-200 hover:bg-red-100"
                    onClick={() => router.push("/admin")}
                  >
                    <div className="text-center">
                      <Shield className="h-6 w-6 mx-auto mb-2 text-red-600" />
                      <span className="text-red-600">Admin Panel</span>
                    </div>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Receipts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Receipts
            </CardTitle>
            <CardDescription>Your uploaded payment receipts and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReceipts ? (
              <div className="text-center py-8">
                <LoadingSpinner size="md" text="Loading receipts..." />
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No receipts uploaded yet</p>
                <Button onClick={() => router.push("/upload")}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Receipt
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{receipt.filename}</p>
                        <p className="text-sm text-gray-500">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {new Date(receipt.upload_date).toLocaleDateString()}
                        </p>
                        {receipt.description && <p className="text-sm text-gray-600">{receipt.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-gray-900">R{receipt.amount.toFixed(2)}</span>
                      <Badge className={getStatusColor(receipt.status)}>
                        {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteReceipt(receipt)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      {/* Delete Receipt Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Receipt</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete the receipt "{receiptToDelete?.filename}"? This action cannot be undone.
            </p>
            {receiptToDelete?.status === "verified" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This receipt has been verified and deleting it will also remove the
                  associated payment record.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteReceipt} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Receipt
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
