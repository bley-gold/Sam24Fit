"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, LogOut, FileText, Check, X, Eye, TrendingUp } from "lucide-react"

interface Receipt {
  id: string
  filename: string
  uploadDate: string
  status: "pending" | "verified" | "rejected"
  amount?: string
  description?: string
}

export default function AdminPage() {
  // Remove useEffect and router logic
  const user = { name: "Admin", email: "admin@sam24fit.com", role: "admin" }
  const [receipts, setReceipts] = useState([
    {
      id: "1",
      filename: "gym-payment-jan.jpg",
      uploadDate: "2024-01-15",
      status: "pending" as const,
      amount: "59.00",
      description: "Monthly membership fee",
    },
    {
      id: "2",
      filename: "membership-fee-dec.pdf",
      uploadDate: "2023-12-15",
      status: "verified" as const,
      amount: "59.00",
      description: "Premium membership",
    },
    {
      id: "3",
      filename: "personal-training.jpg",
      uploadDate: "2024-01-10",
      status: "rejected" as const,
      amount: "80.00",
      description: "Personal training session",
    },
  ])

  const handleLogout = () => {
    alert("Logout functionality would work here!")
  }

  const updateReceiptStatus = (receiptId: string, newStatus: "verified" | "rejected") => {
    const updatedReceipts = receipts.map((receipt) =>
      receipt.id === receiptId ? { ...receipt, status: newStatus } : receipt,
    )
    setReceipts(updatedReceipts)
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

  const stats = {
    totalReceipts: receipts.length,
    pendingReceipts: receipts.filter((r) => r.status === "pending").length,
    verifiedReceipts: receipts.filter((r) => r.status === "verified").length,
    totalAmount: receipts
      .filter((r) => r.status === "verified" && r.amount)
      .reduce((sum, r) => sum + Number.parseFloat(r.amount || "0"), 0),
  }

  if (!user) return null

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
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
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
            {receipts.length === 0 ? (
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
                        {receipt.amount && <span className="font-bold text-lg text-gray-900">${receipt.amount}</span>}
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
