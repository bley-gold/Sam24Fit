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
import {
  Dumbbell,
  Upload,
  FileText,
  LogOut,
  User,
  Calendar,
  CreditCard,
  Shield,
  Trash2,
  Eye,
  Bell,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { deleteReceipt } from "@/app/actions/receipt-actions"
import { createReview, getUserReviews, type Review } from "@/app/actions/review-actions"

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
  const [receiptToPreview, setReceiptToPreview] = useState<Receipt | null>(null)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [recentStatusChanges, setRecentStatusChanges] = useState<Receipt[]>([])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [userReviews, setUserReviews] = useState<Review[]>([])
  const [reviewText, setReviewText] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const getDismissedNotifications = (): string[] => {
    if (typeof window === "undefined" || !user?.id) return []
    const key = `dismissed_notifications_${user.id}`
    try {
      const dismissed = localStorage.getItem(key)
      return dismissed ? JSON.parse(dismissed) : []
    } catch (error) {
      console.error("Error reading dismissed notifications:", error)
      return []
    }
  }

  const saveDismissedNotifications = (dismissedIds: string[]) => {
    if (typeof window === "undefined" || !user?.id) return
    const key = `dismissed_notifications_${user.id}`
    try {
      localStorage.setItem(key, JSON.stringify(dismissedIds))
    } catch (error) {
      console.error("Error saving dismissed notifications:", error)
    }
  }

  const clearDismissedNotifications = () => {
    if (typeof window === "undefined") return
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith("dismissed_notifications_"))
      keys.forEach((key) => localStorage.removeItem(key))
    } catch (error) {
      console.error("Error clearing dismissed notifications:", error)
    }
  }

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

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const recentChanges = (data || []).filter((receipt) => {
        const updatedAt = new Date(receipt.updated_at || receipt.created_at)
        return (receipt.status === "verified" || receipt.status === "rejected") && updatedAt > sevenDaysAgo
      })

      let filteredChanges = recentChanges
      if (user?.id) {
        const dismissedIds = getDismissedNotifications()
        filteredChanges = recentChanges.filter((receipt) => !dismissedIds.includes(receipt.id))
      }

      setRecentStatusChanges(filteredChanges)
      setReceipts(data || [])

      if (user?.id) {
        const reviewsResult = await getUserReviews(user.id)
        if (reviewsResult.success) {
          setUserReviews(reviewsResult.data)
        }
      }
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
      clearDismissedNotifications()
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

  const handleProfileUpdate = async () => {
    await refreshUser()
  }

  const handleDeleteReceipt = async (receipt: Receipt) => {
    setReceiptToDelete(receipt)
    setIsDeleteDialogOpen(true)
  }

  const handlePreviewReceipt = async (receipt: Receipt) => {
    setReceiptToPreview(receipt)
    setIsPreviewDialogOpen(true)
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

  const dismissNotification = (receiptId: string) => {
    if (user?.id) {
      const currentDismissed = getDismissedNotifications()
      const updatedDismissed = [...currentDismissed, receiptId]
      saveDismissedNotifications(updatedDismissed)
    }

    setRecentStatusChanges((prev) => prev.filter((receipt) => receipt.id !== receiptId))
  }

  const getEffectiveRole = () => {
    return user?.role || "user"
  }

  const isAdmin = () => {
    return getEffectiveRole() === "admin"
  }

  const getFileType = (filename: string) => {
    const extension = filename.toLowerCase().split(".").pop()
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return "image"
    } else if (extension === "pdf") {
      return "pdf"
    }
    return "unknown"
  }

  const calculateStreakData = () => {
    const months = []
    const now = new Date()

    for (let i = 23; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`

      // Check payment activity for this month
      const monthPayments = receipts.filter((receipt) => {
        if (receipt.status !== "verified") return false
        const receiptDate = new Date(receipt.upload_date)
        const receiptMonthKey = `${receiptDate.getFullYear()}-${String(receiptDate.getMonth() + 1).padStart(2, "0")}`

        return receiptMonthKey === monthKey
      }).length

      // Determine intensity level (0-4)
      let intensity = 0
      if (monthPayments > 0) intensity = 1
      if (monthPayments > 1) intensity = 2
      if (monthPayments > 2) intensity = 3
      if (monthPayments > 3) intensity = 4

      months.push({
        date: monthDate,
        paymentCount: monthPayments,
        intensity,
        monthKey,
        monthName: monthDate.toLocaleDateString("en-US", { month: "short" }),
        year: monthDate.getFullYear(),
      })
    }

    return months
  }

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return "bg-gray-100 border-gray-200"
      case 1:
        return "bg-green-200 border-green-300"
      case 2:
        return "bg-green-300 border-green-400"
      case 3:
        return "bg-green-500 border-green-600"
      case 4:
        return "bg-green-700 border-green-800"
      default:
        return "bg-gray-100 border-gray-200"
    }
  }

  const StreakGraphic = () => {
    const streakData = calculateStreakData()
    const currentStreak = calculateCurrentStreak()

    // Split data into two years (12 months each)
    const previousYearData = streakData.slice(0, 12)
    const currentYearData = streakData.slice(12, 24)

    const previousYear = previousYearData[0]?.year
    const currentYear = currentYearData[0]?.year

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Gym Payment Activity</h3>
          <div className="text-xs text-gray-600">
            Current streak: <span className="font-semibold text-orange-600">{currentStreak} months</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Month labels */}
          <div className="flex">
            <div className="w-12 mr-3"></div> {/* Space for year labels */}
            <div className="grid grid-cols-12 gap-1 flex-1 text-xs text-gray-600 text-center">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
                <div key={month} className="text-[10px]">
                  {month}
                </div>
              ))}
            </div>
          </div>

          {/* Previous Year Row */}
          <div className="flex items-center">
            <div className="w-12 mr-3 text-xs text-gray-600 text-right font-medium">{previousYear}</div>
            <div className="grid grid-cols-12 gap-1 flex-1">
              {previousYearData.map((month, index) => (
                <div
                  key={`prev-${index}`}
                  className={`w-4 h-4 rounded-sm border ${getIntensityColor(month.intensity)}`}
                  title={`${month.monthName} ${month.year}: ${month.paymentCount} payment${month.paymentCount !== 1 ? "s" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* Current Year Row */}
          <div className="flex items-center">
            <div className="w-12 mr-3 text-xs text-gray-600 text-right font-medium">{currentYear}</div>
            <div className="grid grid-cols-12 gap-1 flex-1">
              {currentYearData.map((month, index) => (
                <div
                  key={`curr-${index}`}
                  className={`w-4 h-4 rounded-sm border ${getIntensityColor(month.intensity)}`}
                  title={`${month.monthName} ${month.year}: ${month.paymentCount} payment${month.paymentCount !== 1 ? "s" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
            <span>Less</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></div>
              <div className="w-3 h-3 rounded-sm bg-green-200 border border-green-300"></div>
              <div className="w-3 h-3 rounded-sm bg-green-300 border border-green-400"></div>
              <div className="w-3 h-3 rounded-sm bg-green-500 border border-green-600"></div>
              <div className="w-3 h-3 rounded-sm bg-green-700 border border-green-800"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    )
  }

  const calculateCurrentStreak = () => {
    const streakData = calculateStreakData()
    let streak = 0

    // Count from the most recent month backwards
    for (let i = streakData.length - 1; i >= 0; i--) {
      if (streakData[i].paymentCount > 0) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const handleSubmitReview = async () => {
    if (!user || !reviewText.trim()) return

    setIsSubmittingReview(true)
    try {
      const result = await createReview(user.id, reviewText.trim(), reviewRating)

      if (result.success) {
        toast({
          title: "Review Submitted",
          description: "Thank you for your review! It will be reviewed by our team before being published.",
        })
        setReviewText("")
        setReviewRating(5)
        const reviewsResult = await getUserReviews(user.id)
        if (reviewsResult.success) {
          setUserReviews(reviewsResult.data)
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to submit review.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while submitting your review.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReview(false)
    }
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
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {recentStatusChanges.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {recentStatusChanges.length}
                    </span>
                  )}
                </Button>

                {isNotificationOpen && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <Button variant="ghost" size="sm" onClick={() => setIsNotificationOpen(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {recentStatusChanges.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No recent notifications</div>
                      ) : (
                        <div className="space-y-1">
                          {recentStatusChanges.map((receipt) => (
                            <div key={receipt.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                              <div className="flex items-center space-x-3 flex-1">
                                {receipt.status === "verified" ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    Receipt {receipt.status === "verified" ? "Approved" : "Rejected"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {receipt.filename} - R{receipt.amount.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissNotification(receipt.id)}
                                className="flex-shrink-0 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Manage your gym payments and receipts</p>

          {user.role === "admin" && jwtRole !== "admin" && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Admin Access Notice</h3>
              <p className="text-sm text-yellow-700 mb-3">
                You have admin privileges in the database, but your JWT token doesn't reflect this. You can still access
                admin features, but some functionality may be limited.
              </p>
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => router.push("/admin")}>
                  Go to Admin Panel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Share Your Experience</h3>

                  {userReviews.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">Your previous reviews:</p>
                      <div className="space-y-2">
                        {userReviews.map((review) => (
                          <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <Badge
                                className={
                                  review.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {review.status === "approved" ? "Approved" : "Pending"}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-700">{review.review_text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Rating</label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className={`text-lg ${
                              star <= reviewRating ? "text-yellow-400" : "text-gray-300"
                            } hover:text-yellow-400 transition-colors`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Your Review</label>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your experience with Sam24Fit..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">{reviewText.length}/500 characters</p>
                    </div>

                    <Button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || !reviewText.trim()}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-sm py-2"
                    >
                      {isSubmittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <StreakGraphic />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Receipts
            </CardTitle>
            <CardDescription>Your uploaded payment receipts</CardDescription>
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
                        onClick={() => handlePreviewReceipt(receipt)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          {receiptToPreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-500">Filename:</label>
                  <p className="text-gray-900">{receiptToPreview.filename}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Amount:</label>
                  <p className="text-gray-900">R{receiptToPreview.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Upload Date:</label>
                  <p className="text-gray-900">{new Date(receiptToPreview.upload_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Status:</label>
                  <Badge className={getStatusColor(receiptToPreview.status)}>
                    {receiptToPreview.status.charAt(0).toUpperCase() + receiptToPreview.status.slice(1)}
                  </Badge>
                </div>
                {receiptToPreview.description && (
                  <div className="col-span-2">
                    <label className="font-medium text-gray-500">Description:</label>
                    <p className="text-gray-900">{receiptToPreview.description}</p>
                  </div>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden">
                {getFileType(receiptToPreview.filename) === "image" ? (
                  <Image
                    src={receiptToPreview.file_url || "/placeholder.svg"}
                    alt={`Receipt: ${receiptToPreview.filename}`}
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain"
                    unoptimized
                  />
                ) : getFileType(receiptToPreview.filename) === "pdf" ? (
                  <div className="w-full h-[600px]">
                    <iframe
                      src={receiptToPreview.file_url}
                      className="w-full h-full border-0"
                      title={`Receipt: ${receiptToPreview.filename}`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50">
                    <FileText className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <Button
                      onClick={() => window.open(receiptToPreview.file_url, "_blank")}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Open File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
