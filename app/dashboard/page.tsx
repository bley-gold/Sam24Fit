"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { useAuthContext } from "@/components/auth-provider"
import { signOut } from "@/lib/auth"
import { supabase, type Receipt } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  Dumbbell,
  LogOut,
  Upload,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  User,
  RefreshCw,
  CreditCard,
} from "lucide-react"

export default function DashboardPage() {
  const { user, loading: authLoading, refreshUser } = useAuthContext()
  const router = useRouter()
  const { toast } = useToast()

  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loadingReceipts, setLoadingReceipts] = useState(true)
  const [refreshingReceipts, setRefreshingReceipts] = useState(false)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  const fetchReceipts = useCallback(async () => {
    if (!user?.id || !mountedRef.current) {
      return
    }

    try {
      if (!refreshingReceipts) {
        setLoadingReceipts(true)
      }
      setReceiptError(null)

      const { data, error: fetchError } = await supabase
        .from("receipts")
        .select("*")
        .eq("user_id", user.id)
        .order("upload_date", { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      if (mountedRef.current) {
        setReceipts(data || [])
        setReceiptError(null)
      }
    } catch (error) {
      console.error("Error fetching receipts:", error)
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load receipts"
        setReceiptError(errorMessage)
        
        // Only show toast for non-initial loads
        if (!loadingReceipts) {
          toast({
            title: "Error",
            description: "Failed to refresh receipts. Please try again.",
            variant: "destructive",
          })
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoadingReceipts(false)
        setRefreshingReceipts(false)
      }
    }
  }, [user?.id, toast, refreshingReceipts, loadingReceipts])

  const handleRefreshReceipts = useCallback(async () => {
    if (refreshingReceipts || !user?.id) return
    
    setRefreshingReceipts(true)
    await fetchReceipts()
  }, [fetchReceipts, refreshingReceipts, user?.id])

  const handleRetryReceipts = useCallback(async () => {
    setReceiptError(null)
    setLoadingReceipts(true)
    await fetchReceipts()
  }, [fetchReceipts])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
      return
    }

    if (user) {
      fetchReceipts()
    }
  }, [user, authLoading, router, fetchReceipts])

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleProfileRefresh = async () => {
    try {
      await refreshUser()
      toast({
        title: "Profile refreshed",
        description: "Your profile has been updated.",
      })
    } catch (error) {
      console.error("Profile refresh error:", error)
      toast({
        title: "Error",
        description: "Failed to refresh profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
    return null // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-3 sm:gap-0">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sam24Fit</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-600 truncate">Welcome, {user.full_name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="w-full sm:w-auto bg-transparent">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage your membership and payments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Your Profile
                </CardTitle>
                <CardDescription className="text-sm">Your membership information</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                      <AvatarImage 
                        src={user.profile_picture_url || undefined} 
                        alt={user.full_name}
                        onError={(e) => {
                          console.warn("Profile picture failed to load:", user.profile_picture_url)
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <AvatarFallback className="bg-orange-100 text-orange-600 text-lg sm:text-xl font-semibold">
                        {user.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ProfilePictureUpload user={user} onProfileUpdate={handleProfileRefresh} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{user.full_name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{user.email}</p>
                    <Badge
                      className={`text-xs ${
                        user.membership_status === "active"
                          ? "bg-green-100 text-green-800"
                          : user.membership_status === "inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user.membership_status?.charAt(0).toUpperCase() + user.membership_status?.slice(1)}
                    </Badge>
                  </div>
                  <div className="w-full pt-4 border-t space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{user.phone}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Member since:</span>
                      <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    {user.last_payment_date && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">Last payment:</span>
                        <span className="font-medium">{new Date(user.last_payment_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Receipts Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Your Receipts
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleRefreshReceipts} 
                      size="sm" 
                      variant="outline" 
                      disabled={refreshingReceipts}
                      className="bg-transparent"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshingReceipts ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button onClick={() => router.push("/upload")} size="sm" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Receipt
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-sm">Upload and track your payment receipts</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {receiptError ? (
                  <div className="text-center py-8">
                    <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Receipts</h3>
                    <p className="text-gray-600 mb-4">{receiptError}</p>
                    <Button onClick={handleRetryReceipts} className="bg-orange-600 hover:bg-orange-700">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : loadingReceipts ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="md" text="Loading receipts..." />
                  </div>
                ) : receipts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts uploaded yet</h3>
                    <p className="text-gray-600 mb-4">Upload your first payment receipt to get started.</p>
                    <Button onClick={() => router.push("/upload")} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Your First Receipt
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {receipts.map((receipt) => (
                      <div
                        key={receipt.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3 sm:gap-4"
                      >
                        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            {getStatusIcon(receipt.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                {receipt.filename}
                              </p>
                              <Badge className={`${getStatusColor(receipt.status)} text-xs`}>
                                {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                              <p className="text-xs sm:text-sm text-gray-500 flex items-center">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 flex-shrink-0" />
                                {new Date(receipt.upload_date).toLocaleDateString()}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 flex items-center">
                                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 flex-shrink-0" />
                                R{receipt.amount?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                            {receipt.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                                {receipt.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                window.open(receipt.file_url, "_blank")
                              } catch (error) {
                                console.error("Error opening receipt:", error)
                                toast({
                                  title: "Error",
                                  description: "Failed to open receipt. Please try again.",
                                  variant: "destructive",
                                })
                              }
                            }}
                            className="text-xs sm:text-sm bg-transparent"
                          >
                            View Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/upload")}>
            <CardContent className="p-4 sm:p-6 text-center">
              <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-orange-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Upload Receipt</h3>
              <p className="text-xs sm:text-sm text-gray-600">Upload a new payment receipt</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/payments")}>
            <CardContent className="p-4 sm:p-6 text-center">
              <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Payment History</h3>
              <p className="text-xs sm:text-sm text-gray-600">View your payment records</p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer sm:col-span-2 lg:col-span-1"
            onClick={() => router.push("/")}
          >
            <CardContent className="p-4 sm:p-6 text-center">
              <Dumbbell className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Back to Home</h3>
              <p className="text-xs sm:text-sm text-gray-600">Return to the main website</p>
            </CardContent>
          </Card>
        </div>

        {/* Membership Status Summary */}
        <div className="mt-6 sm:mt-8">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Membership Summary</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-medium text-green-900">
                    {receipts.filter((r) => r.status === "verified").length}
                  </p>
                  <p className="text-xs text-green-700">Verified Receipts</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-medium text-yellow-900">
                    {receipts.filter((r) => r.status === "pending").length}
                  </p>
                  <p className="text-xs text-yellow-700">Pending Review</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-medium text-blue-900">
                    R
                    {receipts
                      .filter((r) => r.status === "verified")
                      .reduce((sum, r) => sum + (r.amount || 0), 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-700">Total Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}