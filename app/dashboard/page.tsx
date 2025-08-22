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
import { jsPDF } from "jspdf"

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
  const [canSubmitReview, setCanSubmitReview] = useState(true)
  const [nextReviewDate, setNextReviewDate] = useState<string | null>(null)
  const [isWelcomeDialogOpen, setIsWelcomeDialogOpen] = useState(false)
  const [welcomeDialogStep, setWelcomeDialogStep] = useState(1)
  const [hasPdfDownloaded, setHasPdfDownloaded] = useState(false)

  const generateGymRules = () => {
    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    return `MEMBERSHIP AGREEMENT
(This is a legally binding document. Please read carefully.)

MEMBER DETAILS
Full Name: ${user?.full_name || ""}
ID Number/Passport: ${user?.id_number || ""}
Residential Address: ${user?.street_address || ""}
Cell Number: ${user?.phone || ""}
Email: ${user?.email || ""}

SHORT RULES OF THE GYM (HOUSE RULES)
• Train at your own risk.
• Arrange the equipment after use.
• Respect other members and staff.
• No inappropriate behavior or language.
• Proper gym attire is required.
• Report damaged equipment immediately. If you damage anything in the gym, you will pay.
• Management reserves the right to cancel membership due to rule violations.

DISCLAIMER / INDEMNITY
I, the undersigned member, understand and acknowledge that:
I am voluntarily participating in physical activities at this gym, and I do so entirely at my own risk.
The owner(s), staff, and affiliates of the gym are not liable for any injury, illness, death, or loss/damage to personal property that may occur on the premises, including but not limited to use of equipment, facilities, or participation in training activities.
I have consulted a medical professional (if necessary), and I am physically fit to train.
I agree to follow the gym's rules and understand that a violation may result in the termination of my membership without refund.

Agreement Date: ${formattedDate}

This agreement has been digitally accepted through the Sam24Fit registration system.`
  }

  const downloadGymRules = async () => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const margin = 20
      const maxWidth = pageWidth - margin * 2

      doc.setFillColor(234, 88, 12) // Orange color
      doc.rect(0, 0, pageWidth, 30, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.text("Sam24Fit", margin, 20)

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text("Membership Agreement & Gym Rules", margin, 26)

      doc.setTextColor(0, 0, 0)
      let yPosition = 45

      const rulesText = generateGymRules()
      const lines = doc.splitTextToSize(rulesText, maxWidth)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")

      lines.forEach((line: string) => {
        if (yPosition > 270) {
          // Check if we need a new page
          doc.addPage()
          yPosition = 20
        }

        if (
          line.includes("MEMBERSHIP AGREEMENT") ||
          line.includes("MEMBER DETAILS") ||
          line.includes("SHORT RULES") ||
          line.includes("DISCLAIMER")
        ) {
          doc.setFont("helvetica", "bold")
          doc.setFontSize(12)
        } else {
          doc.setFont("helvetica", "normal")
          doc.setFontSize(10)
        }

        doc.text(line, margin, yPosition)
        yPosition +=
          line.includes("MEMBERSHIP AGREEMENT") ||
          line.includes("MEMBER DETAILS") ||
          line.includes("SHORT RULES") ||
          line.includes("DISCLAIMER")
            ? 8
            : 5
      })

      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`Sam24Fit - Page ${i} of ${pageCount}`, pageWidth - margin - 30, 285)
        doc.text("Generated on: " + new Date().toLocaleDateString(), margin, 285)
      }

      doc.save(`Sam24Fit_Membership_Agreement_${user?.full_name?.replace(/\s+/g, "_") || "Member"}.pdf`)

      setHasPdfDownloaded(true)

      toast({
        title: "Download Complete",
        description: "Your personalized membership agreement has been downloaded.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Download Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  const shouldShowWelcomeDialog = () => {
    if (typeof window === "undefined" || !user?.id) return false
    const key = `welcome_dialog_shown_${user.id}`
    return !localStorage.getItem(key)
  }

  const markWelcomeDialogShown = () => {
    if (typeof window === "undefined" || !user?.id) return
    const key = `welcome_dialog_shown_${user.id}`
    localStorage.setItem(key, "true")
  }

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

  const handleWelcomeDialogComplete = async () => {
    markWelcomeDialogShown()
    setIsWelcomeDialogOpen(false)
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
      if (shouldShowWelcomeDialog()) {
        setIsWelcomeDialogOpen(true)
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (user) {
        const { canUserSubmitReview } = await import("../actions/review-actions")
        const result = await canUserSubmitReview(user.id)
        if (result.success) {
          setCanSubmitReview(result.canSubmit)
          setNextReviewDate(result.nextSubmissionDate)
        }
      }
    }

    checkReviewEligibility()
  }, [user])

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
    console.log("[v0] Receipt preview data:", {
      id: receipt.id,
      filename: receipt.filename,
      status: receipt.status,
      rejection_reason: receipt.rejection_reason,
      hasRejectionReason: !!receipt.rejection_reason,
      rejectionReasonType: typeof receipt.rejection_reason,
    })
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
    const months: any[] = []
    const now = new Date()

    // Generate the last 24 months
    for (let i = 23; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`

      const hasPayment = receipts.some((receipt) => {
        if (receipt.status !== "verified") return false
        const receiptDate = new Date(receipt.upload_date)
        const receiptMonthKey = `${receiptDate.getFullYear()}-${String(receiptDate.getMonth() + 1).padStart(2, "0")}`
        return receiptMonthKey === monthKey
      })

      months.push({
        date: monthDate,
        hasPayment,
        monthKey,
        monthName: monthDate.toLocaleDateString("en-US", { month: "short" }),
        year: monthDate.getFullYear(),
        monthIndex: monthDate.getMonth(),
      })
    }

    return months
  }

  const groupByYear = (months: any[]) => {
    const grouped: Record<number, (any | null)[]> = {}

    months.forEach((m) => {
      if (!grouped[m.year]) grouped[m.year] = new Array(12).fill(null)
      grouped[m.year][m.monthIndex] = m
    })

    return grouped
  }

  const calculateCurrentStreak = () => {
    const streakData = calculateStreakData()
    let streak = 0

    for (let i = streakData.length - 1; i >= 0; i--) {
      if (streakData[i].hasPayment) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const StreakGraphic = () => {
    const streakData = calculateStreakData()
    const currentStreak = calculateCurrentStreak()
    const grouped = groupByYear(streakData)

    // Sort years ascending
    const years = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)

    const now = new Date()
    const currentMonth = now.getMonth()

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Gym Attendance Streak</h3>
          <div className="text-xs text-gray-600">
            Current streak: <span className="font-semibold text-green-600">{currentStreak} months</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Month labels */}
          <div className="flex">
            <div className="w-12 mr-3"></div>
            <div className="grid grid-cols-12 gap-1 flex-1 text-xs text-gray-600 text-center">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
                <div key={month} className="text-[10px]">
                  {month}
                </div>
              ))}
            </div>
          </div>

          {/* Year rows */}
          {years.map((year) => (
            <div key={year} className="flex items-center">
              <div className="w-12 mr-3 text-xs text-gray-600 text-right font-medium">{year}</div>
              <div className="grid grid-cols-12 gap-1 flex-1">
                {grouped[year].map((month, index) => {
                  // Hide future months for the current year
                  if (year === now.getFullYear() && index > currentMonth) return null

                  // Determine if this is the last month of the current streak
                  const streakStartIndex = streakData.length - currentStreak
                  const isLastStreakMonth =
                    month && streakData.findIndex((m) => m.monthKey === month.monthKey) === streakStartIndex

                  return (
                    <div
                      key={`${year}-${index}`}
                      className={`w-4 h-4 rounded-sm border ${
                        month?.hasPayment ? "bg-green-500 border-green-600" : "bg-gray-200 border-gray-300"
                      } ${isLastStreakMonth ? "ring-2 ring-green-400" : ""}`} // subtle highlight
                      title={
                        month
                          ? `${month.monthName} ${month.year}: ${
                              month.hasPayment ? "Attendance recorded" : "No attendance"
                            }`
                          : "No data"
                      }
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
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
        setCanSubmitReview(false)
        const nextDate = new Date()
        nextDate.setMonth(nextDate.getMonth() + 3)
        setNextReviewDate(nextDate.toISOString())

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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-3 sm:gap-0">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sam24Fit</h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-sm sm:text-base font-medium text-gray-700 truncate">Welcome, {user.full_name}</span>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                {isAdmin() && (
                  <Badge className="bg-red-100 text-red-800 text-xs">
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
                    <div className="fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm sm:max-w-96 bg-white rounded-lg shadow-xl border z-[9999]">
                      <div className="p-3 sm:p-4 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
                          <Button variant="ghost" size="sm" onClick={() => setIsNotificationOpen(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {recentStatusChanges.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">No recent notifications</div>
                        ) : (
                          <div className="space-y-1">
                            {recentStatusChanges.map((receipt) => (
                              <div
                                key={receipt.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 hover:bg-gray-50 gap-2 sm:gap-0"
                              >
                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                  {receipt.status === "verified" ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                      Receipt {receipt.status === "verified" ? "Approved" : "Rejected"}
                                    </p>
                                    <p className="text-xs text-gray-500 break-all">
                                      {receipt.filename} - R{receipt.amount.toFixed(2)}
                                    </p>
                                    {receipt.status === "rejected" && receipt.rejection_reason && (
                                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-xs font-medium text-red-800">Rejection Reason:</p>
                                        <p className="text-xs text-red-700 break-words">{receipt.rejection_reason}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => dismissNotification(receipt.id)}
                                  className="flex-shrink-0 h-6 w-6 p-0 self-start sm:self-center"
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin")}
                    className="text-xs sm:text-sm whitespace-nowrap"
                  >
                    Admin Panel
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs sm:text-sm bg-transparent"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:py-8 px-4">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage your gym payments and receipts</p>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Image
                    src={user.profile_picture_url || "/placeholder.svg?height=96&width=96&query=user profile"}
                    alt="Profile Picture"
                    width={80}
                    height={80}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-orange-500"
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
                <label className="text-sm font-medium text-gray-500">ID Number</label>
                <p className="text-gray-900">{user.id_number || "Not provided"}</p>
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
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-sm">Upload receipts and manage your payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Button
                  className="h-16 sm:h-20 bg-orange-600 hover:bg-orange-700 text-sm sm:text-base"
                  onClick={() => router.push("/upload")}
                >
                  <div className="text-center">
                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
                    <span>Upload Receipt</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 sm:h-20 bg-transparent text-sm sm:text-base"
                  onClick={() => router.push("/payments")}
                >
                  <div className="text-center">
                    <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
                    <span>Payment History</span>
                  </div>
                </Button>
                {isAdmin() && (
                  <Button
                    variant="outline"
                    className="h-16 sm:h-20 bg-red-50 border-red-200 hover:bg-red-100 text-sm sm:text-base sm:col-span-2"
                    onClick={() => router.push("/admin")}
                  >
                    <div className="text-center">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-red-600" />
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
                                    : review.status === "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {review.status === "approved"
                                  ? "Approved"
                                  : review.status === "rejected"
                                    ? "Rejected"
                                    : "Pending"}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-700">{review.review_text}</p>
                            {review.status === "rejected" && review.rejection_reason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-xs font-medium text-red-800">Rejection Reason:</p>
                                <p className="text-xs text-red-700">{review.rejection_reason}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {!canSubmitReview && nextReviewDate && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          You can submit your next review on{" "}
                          <strong>
                            {new Date(nextReviewDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </strong>
                          . Reviews are limited to once every 3 months.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Rating</label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            disabled={!canSubmitReview}
                            className={`text-lg ${
                              star <= reviewRating ? "text-yellow-400" : "text-gray-300"
                            } hover:text-yellow-400 transition-colors ${
                              !canSubmitReview ? "opacity-50 cursor-not-allowed" : ""
                            }`}
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
                        disabled={!canSubmitReview}
                      />
                      <p className="text-xs text-gray-500 mt-1">{reviewText.length}/500 characters</p>
                    </div>

                    <Button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || !reviewText.trim() || !canSubmitReview}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-sm py-2"
                    >
                      {isSubmittingReview
                        ? "Submitting..."
                        : canSubmitReview
                          ? "Submit Review"
                          : "Review Submitted Recently"}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <StreakGraphic />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Details - Bank Account Information
              </CardTitle>
              <CardDescription className="text-green-700">
                Use these bank details to make your gym membership payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-green-800">Bank Name</label>
                    <p className="text-gray-900 font-semibold">First National Bank (FNB)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-800">Account Holder</label>
                    <p className="text-gray-900 font-semibold">Sam24Fit Gym (Pty) Ltd</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-800">Account Number</label>
                    <p className="text-gray-900 font-semibold text-lg">62847291056</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-green-800">Branch Code</label>
                    <p className="text-gray-900 font-semibold">250655</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-800">Account Type</label>
                    <p className="text-gray-900 font-semibold">Business Current Account</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-800">Reference</label>
                    <p className="text-gray-900 font-semibold">Use your full name + membership</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-green-100 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Payment Instructions:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>
                    • <strong>Membership Fee:</strong> R120 per month
                  </li>
                  <li>
                    • <strong>Admin Fee:</strong> R50 (one-time for new members)
                  </li>
                  <li>
                    • <strong>Reference:</strong> Use "{user?.full_name || "Your Name"} - Membership" as payment
                    reference
                  </li>
                  <li>
                    • <strong>After Payment:</strong> Upload your proof of payment using the "Upload Receipt" button
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Recent Receipts
              </CardTitle>
              <CardDescription className="text-sm">Your uploaded payment receipts</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReceipts ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="md" text="Loading receipts..." />
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4 text-sm sm:text-base">No receipts uploaded yet</p>
                  <Button onClick={() => router.push("/upload")} className="text-sm sm:text-base">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Receipt
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex flex-col md:flex-row md:items-center p-4 border rounded-lg gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <FileText className="h-8 w-8 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-base break-all">{receipt.filename}</p>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <Calendar className="h-4 w-4 inline mr-1 flex-shrink-0" />
                            {new Date(receipt.upload_date).toLocaleDateString()}
                          </p>
                          {receipt.description && (
                            <p className="text-sm text-gray-600 mt-1 break-words">{receipt.description}</p>
                          )}
                          {receipt.status === "rejected" && receipt.rejection_reason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-xs font-medium text-red-800">Rejection Reason:</p>
                              <p className="text-xs text-red-700 break-words">{receipt.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-4 flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 text-base">R{receipt.amount.toFixed(2)}</span>
                          <Badge className={`${getStatusColor(receipt.status)} text-xs whitespace-nowrap`}>
                            {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Receipt Preview</DialogTitle>
          </DialogHeader>
          {receiptToPreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-500 text-sm">Filename:</label>
                  <p className="text-gray-900 break-all">{receiptToPreview.filename}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500 text-sm">Amount:</label>
                  <p className="text-gray-900">R{receiptToPreview.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500 text-sm">Upload Date:</label>
                  <p className="text-gray-900">{new Date(receiptToPreview.upload_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500 text-sm">Status:</label>
                  <Badge className={`${getStatusColor(receiptToPreview.status)} text-xs`}>
                    {receiptToPreview.status.charAt(0).toUpperCase() + receiptToPreview.status.slice(1)}
                  </Badge>
                </div>
                {receiptToPreview.description && (
                  <div className="md:col-span-2 lg:col-span-4">
                    <label className="font-medium text-gray-500 text-sm">Description:</label>
                    <p className="text-gray-900 break-words">{receiptToPreview.description}</p>
                  </div>
                )}
                {receiptToPreview.status === "rejected" && (
                  <div className="md:col-span-2 lg:col-span-4">
                    {receiptToPreview.rejection_reason ? (
                      <div>
                        <label className="font-medium text-gray-500 text-sm">Rejection Reason:</label>
                        <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-red-800 break-words">{receiptToPreview.rejection_reason}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="font-medium text-gray-500 text-sm">Rejection Reason:</label>
                        <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-yellow-800">No rejection reason provided</p>
                        </div>
                      </div>
                    )}
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
                    className="w-full h-auto object-contain max-h-[50vh] sm:max-h-[60vh] lg:max-h-[70vh]"
                    unoptimized
                  />
                ) : getFileType(receiptToPreview.filename) === "pdf" ? (
                  <div className="w-full h-[50vh] sm:h-[60vh] lg:h-[70vh]">
                    <iframe
                      src={receiptToPreview.file_url}
                      className="w-full h-full border-0"
                      title={`Receipt: ${receiptToPreview.filename}`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 sm:h-64 bg-gray-50">
                    <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4 text-sm sm:text-base text-center px-4">
                      Preview not available for this file type
                    </p>
                    <Button
                      onClick={() => window.open(receiptToPreview.file_url, "_blank")}
                      className="bg-orange-600 hover:bg-orange-700 text-sm sm:text-base"
                    >
                      Open in New Tab
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
