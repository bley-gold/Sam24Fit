"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { useAuthContext } from "@/components/auth-provider"
import { signOut } from "@/lib/auth"
import type { User, Receipt } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  Dumbbell,
  LogOut,
  FileText,
  Check,
  X,
  Eye,
  Users2,
  DollarSign,
  FileWarning,
  UserIcon,
  BarChart,
  AlertCircle,
  Shield,
  CircleDollarSign,
  UserMinus,
  UserCheck,
  Search,
  Info,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  BrushIcon as Broom,
} from "lucide-react"
import {
  getAllUserProfiles,
  getAdminStats,
  getReceiptsByMonth,
  updateReceiptStatusAdmin,
  getMonthlyRevenue,
  getPaidMembersCurrentMonth,
  getUnpaidMembersCurrentMonth,
  getMembersForDeactivation,
  updateUserMembershipStatus,
  cleanupOldReceipts,
} from "@/app/actions/admin-actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { deleteReceiptAdmin } from "@/app/actions/receipt-actions"

// Define chart config for monthly revenue
const monthlyRevenueChartConfig = {
  revenue: {
    label: "Revenue (ZAR)",
    color: "hsl(var(--chart-1))",
  },
  month_year: {
    label: "Month",
  },
} satisfies ChartConfig

// Define chart config for paid vs unpaid members
const paidUnpaidChartConfig = {
  paid: {
    label: "Paid Members",
    color: "hsl(var(--chart-2))", // Greenish color
  },
  unpaid: {
    label: "Unpaid Members",
    color: "hsl(var(--chart-3))", // Reddish color
  },
} satisfies ChartConfig

export default function AdminPage() {
  const { user, loading: authLoading, refreshUser } = useAuthContext()
  const router = useRouter()
  const { toast } = useToast()

  const [allUsers, setAllUsers] = useState<User[]>([])
  const [receiptsByMonth, setReceiptsByMonth] = useState<{ [key: string]: Receipt[] }>({})
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeMembers: 0,
    pendingReceipts: 0,
    totalRevenue: 0,
    unpaidMembers: 0,
  })
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<
    { month_year: string; revenue: number; payment_count: number }[]
  >([])
  const [paidMembers, setPaidMembers] = useState<(User & { paid_amount: number })[]>([])
  const [unpaidMembers, setUnpaidMembers] = useState<User[]>([])
  const [membersForDeactivation, setMembersForDeactivation] = useState<User[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<Receipt | null>(null)
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false)
  const [selectedUserForProfilePreview, setSelectedUserForProfilePreview] = useState<User | null>(null)
  const [isProfilePreviewOpen, setIsProfilePreviewOpen] = useState(false)

  // Search functionality
  const [searchTerm, setSearchTerm] = useState("")
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allUsers
    const searchLower = searchTerm.toLowerCase()
    return allUsers.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower) ||
        user.emergency_contact_name?.toLowerCase().includes(searchLower),
    )
  }, [allUsers, searchTerm])

  // Get sorted month keys for display
  const sortedMonthKeys = useMemo(() => {
    return Object.keys(receiptsByMonth).sort((a, b) => b.localeCompare(a)) // Most recent first
  }, [receiptsByMonth])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/auth")
      return
    }
    if (user && user.role === "admin") {
      loadAdminData()
    }
  }, [user, authLoading, router])

  const loadAdminData = async () => {
    setLoadingData(true)
    try {
      const [
        usersData,
        statsData,
        receiptsByMonthData,
        monthlyRevenue,
        paidMembersData,
        unpaidMembersData,
        membersToDeactivateData,
      ] = await Promise.all([
        getAllUserProfiles(),
        getAdminStats(),
        getReceiptsByMonth(),
        getMonthlyRevenue(),
        getPaidMembersCurrentMonth(),
        getUnpaidMembersCurrentMonth(),
        getMembersForDeactivation(),
      ])

      if (usersData) setAllUsers(usersData)
      if (statsData) setStats(statsData)
      if (receiptsByMonthData) setReceiptsByMonth(receiptsByMonthData)
      if (monthlyRevenue) setMonthlyRevenueData(monthlyRevenue)
      if (paidMembersData) setPaidMembers(paidMembersData)
      if (unpaidMembersData) setUnpaidMembers(unpaidMembersData)
      if (membersToDeactivateData) setMembersForDeactivation(membersToDeactivateData)
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast({ title: "Logged out", description: "You have been successfully logged out." })
      router.push("/")
    } catch (error) {
      toast({ title: "Error", description: "Failed to log out.", variant: "destructive" })
      console.error("Logout error:", error)
    }
  }

  const handleUpdateReceiptStatus = async (receiptId: string, newStatus: "verified" | "rejected") => {
    if (!user?.id) {
      toast({ title: "Error", description: "Admin user ID not found.", variant: "destructive" })
      return
    }

    // Optimistic update
    setReceiptsByMonth((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((monthKey) => {
        updated[monthKey] = updated[monthKey].map((receipt) =>
          receipt.id === receiptId
            ? {
                ...receipt,
                status: newStatus,
                verified_date: newStatus === "verified" ? new Date().toISOString() : undefined,
                verified_by: user.id,
              }
            : receipt,
        )
      })
      return updated
    })

    setIsReceiptPreviewOpen(false) // Close preview after action

    try {
      const { success, message } = await updateReceiptStatusAdmin(receiptId, newStatus, user.id)
      if (!success) {
        toast({
          title: "Update Failed",
          description: message || "Failed to update receipt status.",
          variant: "destructive",
        })
        // Reload data to revert optimistic update
        loadAdminData()
      } else {
        toast({ title: "Receipt Updated", description: `Receipt status changed to ${newStatus}.` })
        // Re-fetch data to ensure consistency and update stats
        loadAdminData()
      }
    } catch (error) {
      console.error("Error updating receipt status:", error)
      toast({ title: "Update Failed", description: "An unexpected error occurred.", variant: "destructive" })
      // Reload data to revert optimistic update
      loadAdminData()
    }
  }

  const handleUpdateMembershipStatus = async (userId: string, newStatus: "active" | "inactive" | "suspended") => {
    const originalMembers = [...membersForDeactivation]

    // Optimistic update
    setMembersForDeactivation((prev) => prev.filter((member) => member.id !== userId))
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, membership_status: newStatus } : u)))

    try {
      const { success, message } = await updateUserMembershipStatus(userId, newStatus)
      if (!success) {
        toast({
          title: "Update Failed",
          description: message || "Failed to update membership status.",
          variant: "destructive",
        })
        setMembersForDeactivation(originalMembers) // Revert on error
      } else {
        toast({ title: "Membership Updated", description: `User's membership status changed to ${newStatus}.` })
        loadAdminData() // Re-fetch all data to ensure consistency
      }
    } catch (error) {
      console.error("Error updating membership status:", error)
      toast({ title: "Update Failed", description: "An unexpected error occurred.", variant: "destructive" })
      setMembersForDeactivation(originalMembers) // Revert on error
    }
  }

  const handleCleanupOldReceipts = async () => {
    setIsCleaningUp(true)
    try {
      const { success, message } = await cleanupOldReceipts()
      if (success) {
        toast({
          title: "Cleanup Completed",
          description: message,
        })
        // Reload data to reflect changes
        loadAdminData()
      } else {
        toast({
          title: "Cleanup Failed",
          description: message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: "An unexpected error occurred during cleanup.",
        variant: "destructive",
      })
    } finally {
      setIsCleaningUp(false)
    }
  }

  const toggleMonthExpansion = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey)
      } else {
        newSet.add(monthKey)
      }
      return newSet
    })
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

  const openReceiptPreview = (receipt: Receipt) => {
    setSelectedReceiptForPreview(receipt)
    setIsReceiptPreviewOpen(true)
  }

  const openProfilePicturePreview = (user: User) => {
    setSelectedUserForProfilePreview(user)
    setIsProfilePreviewOpen(true)
  }

  const handleAdminProfileUpdate = async () => {
    // Refresh the current user data
    await refreshUser()
  }

  const handleUserProfileUpdate = async (updatedUserId: string) => {
    // Refresh the users list to show updated profile picture
    await loadAdminData()
  }

  const handleDeleteReceipt = async (receipt: Receipt) => {
    setReceiptToDelete(receipt)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteReceipt = async () => {
    if (!receiptToDelete || !user) return

    setIsDeleting(true)
    try {
      const { success, message } = await deleteReceiptAdmin(receiptToDelete.id, user.id)
      if (success) {
        toast({
          title: "Receipt Deleted",
          description: "Receipt has been successfully deleted.",
        })
        // Remove the receipt from local state and reload data to update stats
        setReceiptsByMonth((prev) => {
          const updated = { ...prev }
          Object.keys(updated).forEach((monthKey) => {
            updated[monthKey] = updated[monthKey].filter((r) => r.id !== receiptToDelete.id)
          })
          return updated
        })
        // Reload admin data to update statistics
        loadAdminData()
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

  const paidUnpaidChartData = [
    { name: "Paid", value: paidMembers.length, fill: "var(--color-paid)" },
    { name: "Unpaid", value: unpaidMembers.length, fill: "var(--color-unpaid)" },
  ]

  // Format month-year for display
  const formatMonthYear = (monthYear: string) => {
    try {
      const [year, month] = monthYear.split("-")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    } catch {
      return monthYear
    }
  }

  // Format month-year for chart display (shorter)
  const formatMonthYearChart = (monthYear: string) => {
    try {
      const [year, month] = monthYear.split("-")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    } catch {
      return monthYear
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
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
              <Badge className="bg-red-100 text-red-800">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
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
          <p className="text-gray-600">Comprehensive management and analytics for Sam24Fit</p>
        </div>

        {/* Admin Personal Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Your Admin Profile
            </CardTitle>
            <CardDescription>Details of the currently logged-in administrator</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Image
                src={user.profile_picture_url || "/placeholder.svg?height=120&width=120&query=admin profile"}
                alt="Admin Profile Picture"
                width={120}
                height={120}
                className="rounded-full object-cover border-4 border-orange-500 shadow-md"
              />
              <ProfilePictureUpload user={user} onProfileUpdate={handleAdminProfileUpdate} isAdmin={true} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 flex-1">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-lg font-semibold text-gray-900">{user.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg font-semibold text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <Badge className="bg-red-100 text-red-800 text-base">{user.role}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Member Since</p>
                <p className="text-lg font-semibold text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Overall Statistics
            </CardTitle>
            <CardDescription>Key metrics for the gym's operations</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8">
                <LoadingSpinner size="md" text="Loading stats..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <Users2 className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <Check className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Members</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <FileWarning className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Receipts</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingReceipts}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Unpaid Members (Current Month)</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.unpaidMembers}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Verified Revenue</p>
                      <p className="text-sm text-gray-500 mb-1">From approved receipts</p>
                      <p className="text-2xl font-bold text-gray-900">R{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue Chart - Fixed responsiveness */}
<Card className="mb-8">
  <CardHeader>
    <CardTitle className="flex items-center">
      <BarChart className="h-5 w-5 mr-2" />
      Monthly Revenue
    </CardTitle>
    <CardDescription>Revenue from approved receipts per month</CardDescription>
  </CardHeader>
  <CardContent className="pb-6">
    {loadingData ? (
      <div className="text-center py-8">
        <LoadingSpinner size="md" text="Loading chart data..." />
      </div>
    ) : monthlyRevenueData.length === 0 ? (
      <div className="text-center py-8">
        <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No monthly revenue data available.</p>
      </div>
    ) : (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px] h-[550px]"> {/* bigger chart container */}
          <ChartContainer config={monthlyRevenueChartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={monthlyRevenueData}
                margin={{ top: 30, right: 20, left: 50, bottom: 110 }} // more padding
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month_year"
                  tickFormatter={formatMonthYearChart}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  fontSize={14} // slightly bigger labels
                />
                <YAxis
                  tickFormatter={(value) => `R${value}`}
                  width={70}
                  fontSize={14} // slightly bigger labels
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                          <p className="font-medium">{formatMonthYear(label)}</p>
                          <p className="text-orange-600">
                            Revenue: R{payload[0].value?.toLocaleString()}
                          </p>
                          <p className="text-gray-600">
                            Payments: {payload[0].payload?.payment_count || 0}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#ea580c"
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    )}
  </CardContent>
</Card>


        {/* Paid vs Unpaid Members Overview - Fixed responsiveness */}
<Card className="mb-8">
  <CardHeader>
    <CardTitle className="flex items-center">
      <CircleDollarSign className="h-5 w-5 mr-2" />
      Current Month Membership Status
    </CardTitle>
    <CardDescription className="flex items-center gap-2">
      <Info className="h-4 w-4 text-blue-500" />
      <span>
        <strong>Unpaid Members:</strong> Active members who haven't submitted an approved receipt for the
        current month's membership fee
      </span>
    </CardDescription>
  </CardHeader>
  <CardContent>
    {loadingData ? (
      <div className="text-center py-8">
        <LoadingSpinner size="md" text="Loading membership status..." />
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Paid vs. Unpaid Members</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {paidMembers.length === 0 && unpaidMembers.length === 0 ? (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No membership data for current month.</p>
              </div>
            ) : (
              <div className="w-full h-[400px]"> {/* bigger chart */}
                <ChartContainer config={paidUnpaidChartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" hideLabel />} />
                      <Pie
                        data={paidUnpaidChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="35%"
                        outerRadius="65%"
                        paddingAngle={5}
                        cornerRadius={5}
                      >
                        {paidUnpaidChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paid Members List */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Check className="h-5 w-5 mr-2 text-green-600" />
              Paid Members ({paidMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto"> {/* scroll if too many */}
            {paidMembers.length === 0 ? (
              <p className="text-gray-500 text-sm">No members have paid for the current month yet.</p>
            ) : (
              <ul className="space-y-3">
                {paidMembers.map((member) => (
                  <li key={member.id} className="flex items-center space-x-3">
                    <Image
                      src={member.profile_picture_url || "/placeholder.svg?height=32&width=32&query=user profile"}
                      alt={`${member.full_name}'s profile`}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <div className="flex-1 truncate"> {/* truncates long names */}
                      <p className="font-medium text-gray-900 truncate">{member.full_name}</p>
                      <p className="text-sm text-gray-600 truncate">R{member.paid_amount.toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Unpaid Members List */}
        <Card className="lg:col-span-2 bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <X className="h-5 w-5 mr-2 text-red-600" />
              Unpaid Members ({unpaidMembers.length})
            </CardTitle>
            <CardDescription>
              Active members who haven't submitted approved receipts for this month's membership fee
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto"> {/* scroll if too many */}
            {unpaidMembers.length === 0 ? (
              <p className="text-gray-500 text-sm">All active members have paid for the current month!</p>
            ) : (
              <ul className="space-y-3">
                {unpaidMembers.map((member) => (
                  <li key={member.id} className="flex items-center space-x-3">
                    <Image
                      src={member.profile_picture_url || "/placeholder.svg?height=32&width=32&query=user profile"}
                      alt={`${member.full_name}'s profile`}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <div className="flex-1 truncate"> {/* truncates long names */}
                      <p className="font-medium text-gray-900 truncate">{member.full_name}</p>
                      <p className="text-sm text-gray-600 truncate">{member.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    )}
  </CardContent>
</Card>


        {/* Inactive Members for Deactivation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserMinus className="h-5 w-5 mr-2" />
              Members for Deactivation
            </CardTitle>
            <CardDescription>
              Active members who have not made a membership payment in the last 3 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8">
                <LoadingSpinner size="md" text="Loading inactive members..." />
              </div>
            ) : membersForDeactivation.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No members currently flagged for deactivation.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Profile
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Membership Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {membersForDeactivation.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 h-10 w-10">
                            <Image
                              className="h-10 w-10 rounded-full object-cover"
                              src={
                                member.profile_picture_url || "/placeholder.svg?height=40&width=40&query=user profile"
                              }
                              alt={`${member.full_name}'s profile picture`}
                              width={40}
                              height={40}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              member.membership_status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {member.membership_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateMembershipStatus(member.id, "inactive")}
                          >
                            Deactivate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management with Search */}
<Card className="mb-8">
  <CardHeader>
    <CardTitle className="flex items-center">
      <Users2 className="h-5 w-5 mr-2" />
      User Management
    </CardTitle>
    <CardDescription>View and manage all registered gym members</CardDescription>
  </CardHeader>

  <CardContent>
    {/* Search + PDF Button */}
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="relative w-full sm:w-auto flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search members by name, email, phone, or emergency contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full"
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          if (typeof window === "undefined") return; // client-only
          const { default: jsPDF } = await import("jspdf");
          const autoTable = (await import("jspdf-autotable")).default;

          const doc = new jsPDF();
          doc.text("User List", 14, 10);

          // Include all original columns
          const tableData = filteredUsers.map((u) => [
            u.full_name,
            u.email,
            u.phone,
            new Date(u.date_of_birth).toLocaleDateString(),
            u.gender,
            u.street_address,
            u.emergency_contact_name,
            u.emergency_contact_number,
            u.role,
            u.membership_status,
            new Date(u.created_at).toLocaleDateString(),
          ]);

          autoTable(doc, {
            head: [[
              "Full Name", "Email", "Phone", "DOB", "Gender",
              "Address", "Emergency Contact", "Emergency Phone",
              "Role", "Membership", "Joined"
            ]],
            body: tableData,
            startY: 20,
            styles: { fontSize: 8 },
          });

          doc.save("user_list.pdf");
        }}
      >
        Download PDF
      </Button>
    </div>

    {searchTerm && (
      <p className="text-sm text-gray-600 mb-4">
        Showing {filteredUsers.length} of {allUsers.length} members
      </p>
    )}

    {loadingData ? (
      <div className="text-center py-8">
        <LoadingSpinner size="md" text="Loading users..." />
      </div>
    ) : filteredUsers.length === 0 ? (
      <div className="text-center py-8">
        {searchTerm ? (
          <>
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No members found matching "{searchTerm}"</p>
          </>
        ) : (
          <>
            <Users2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users registered yet.</p>
          </>
        )}
      </div>
    ) : (
      <div className="max-h-[600px] overflow-y-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emergency Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emergency Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membership</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.slice(0, 10).map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Image
                    className="h-10 w-10 rounded-full object-cover"
                    src={member.profile_picture_url || "/placeholder.svg?height=40&width=40&query=user profile"}
                    alt={`${member.full_name}'s profile`}
                    width={40}
                    height={40}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.date_of_birth).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.street_address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.emergency_contact_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.emergency_contact_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    className={
                      member.role === "admin"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {member.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    className={
                      member.membership_status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {member.membership_status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </CardContent>
</Card>

        {/* Receipts Management by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Receipt Management by Month
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanupOldReceipts}
                disabled={isCleaningUp}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
              >
                {isCleaningUp ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Broom className="h-4 w-4 mr-2" />
                    Cleanup Old Receipts
                  </>
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              Review and verify member payment receipts organized by month. Receipts older than 3 months can be
              automatically cleaned up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8">
                <LoadingSpinner size="md" text="Loading receipts..." />
              </div>
            ) : sortedMonthKeys.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No receipts to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedMonthKeys.map((monthKey) => {
                  const monthReceipts = receiptsByMonth[monthKey]
                  const isExpanded = expandedMonths.has(monthKey)
                  const pendingCount = monthReceipts.filter((r) => r.status === "pending").length
                  const verifiedCount = monthReceipts.filter((r) => r.status === "verified").length
                  const rejectedCount = monthReceipts.filter((r) => r.status === "rejected").length

                  return (
                    <div key={monthKey} className="border rounded-lg">
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                        onClick={() => toggleMonthExpansion(monthKey)}
                      >
                        <div className="flex items-center space-x-4">
                          <Calendar className="h-5 w-5 text-gray-500" />
                          <div>
                            <h3 className="font-semibold text-lg">{formatMonthYear(monthKey)}</h3>
                            <p className="text-sm text-gray-600">
                              {monthReceipts.length} receipt{monthReceipts.length !== 1 ? "s" : ""} •{" "}
                              <span className="text-yellow-600">{pendingCount} pending</span> •{" "}
                              <span className="text-green-600">{verifiedCount} verified</span> •{" "}
                              <span className="text-red-600">{rejectedCount} rejected</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {pendingCount > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800">{pendingCount} pending</Badge>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-4">
                          <div className="space-y-4">
                            {monthReceipts.map((receipt) => (
                              <div key={receipt.id} className="bg-white border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    {/* Clickable User Profile Picture */}
                                    <Button
                                      variant="ghost"
                                      className="h-10 w-10 p-0 rounded-full hover:ring-2 hover:ring-orange-500 transition-all"
                                      onClick={() => receipt.users && openProfilePicturePreview(receipt.users)}
                                      disabled={!receipt.users?.profile_picture_url}
                                      title={`View ${receipt.users?.full_name || "User"}'s profile picture`}
                                    >
                                      <Image
                                        src={
                                          receipt.users?.profile_picture_url ||
                                          "/placeholder.svg?height=40&width=40&query=user profile" ||
                                          "/placeholder.svg"
                                        }
                                        alt={`${receipt.users?.full_name || "User"}'s profile picture`}
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover"
                                      />
                                      <span className="sr-only">View profile picture</span>
                                    </Button>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {receipt.users?.full_name || "Unknown User"}
                                      </p>
                                      <p className="text-sm text-gray-500">{receipt.filename}</p>
                                      <p className="text-sm text-gray-500">
                                        Uploaded: {new Date(receipt.upload_date).toLocaleDateString()}
                                      </p>
                                      {receipt.description && (
                                        <p className="text-sm text-gray-600 mt-1">{receipt.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    {receipt.amount && (
                                      <span className="font-bold text-lg text-gray-900">
                                        R{receipt.amount.toFixed(2)}
                                      </span>
                                    )}
                                    <Badge className={getStatusColor(receipt.status)}>
                                      {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex space-x-2 mt-4">
                                  <Button size="sm" variant="outline" onClick={() => openReceiptPreview(receipt)}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    Preview Receipt
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteReceipt(receipt)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                  {receipt.status === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleUpdateReceiptStatus(receipt.id, "verified")}
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Verify
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleUpdateReceiptStatus(receipt.id, "rejected")}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
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
              Are you sure you want to delete the receipt "{receiptToDelete?.filename}" uploaded by{" "}
              {receiptToDelete?.users?.full_name || "Unknown User"}? This action cannot be undone.
            </p>
            {receiptToDelete?.status === "verified" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="inline-block h-4 w-4 mr-1" />
                  <strong>Warning:</strong> This receipt has been verified and deleting it will also remove the
                  associated payment record, which may affect revenue calculations.
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

      {/* Receipt Preview Dialog */}
      <Dialog open={isReceiptPreviewOpen} onOpenChange={setIsReceiptPreviewOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Receipt Preview: {selectedReceiptForPreview?.filename}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex items-center justify-center bg-gray-100 rounded-md">
            {selectedReceiptForPreview?.file_url &&
              (selectedReceiptForPreview.file_url.endsWith(".pdf") ? (
                <iframe
                  src={selectedReceiptForPreview.file_url}
                  className="w-full h-full"
                  title="Receipt PDF Preview"
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={
                      selectedReceiptForPreview.file_url ||
                      "/placeholder.svg?height=600&width=800&query=receipt preview" ||
                      "/placeholder.svg"
                    }
                    alt="Receipt Preview"
                    fill
                    style={{ objectFit: "contain" }}
                    className="rounded-md"
                  />
                </div>
              ))}
          </div>
          {selectedReceiptForPreview && selectedReceiptForPreview.status === "pending" && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleUpdateReceiptStatus(selectedReceiptForPreview.id, "verified")}
              >
                <Check className="h-4 w-4 mr-1" />
                Verify
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleUpdateReceiptStatus(selectedReceiptForPreview.id, "rejected")}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Picture Preview Dialog */}
      <Dialog open={isProfilePreviewOpen} onOpenChange={setIsProfilePreviewOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Profile Picture: {selectedUserForProfilePreview?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {selectedUserForProfilePreview?.profile_picture_url && (
              <Image
                src={
                  selectedUserForProfilePreview.profile_picture_url ||
                  "/placeholder.svg?height=300&width=300&query=user profile large" ||
                  "/placeholder.svg"
                }
                alt={`${selectedUserForProfilePreview.full_name}'s profile picture`}
                width={300}
                height={300}
                className="rounded-full object-cover border-4 border-orange-500 shadow-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
