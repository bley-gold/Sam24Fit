"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAuthContext } from "@/components/auth-provider"
import { uploadReceipt } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Dumbbell, Upload, ArrowLeft, FileText, CheckCircle, User, CreditCard } from "lucide-react"
import { supabase } from "@/lib/supabase"

type PaymentType = "membership" | "admin" | "both"

export default function UploadPage() {
  const { user, loading, refreshUser } = useAuthContext()
  const router = useRouter()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [paymentType, setPaymentType] = useState<PaymentType>("membership")
  const [description, setDescription] = useState("Gym membership fee")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [sessionValid, setSessionValid] = useState(false)
  const [sessionChecking, setSessionChecking] = useState(false)

  useEffect(() => {
    switch (paymentType) {
      case "membership":
        setDescription("Gym membership fee")
        break
      case "admin":
        setDescription("Admin fee")
        break
      case "both":
        setDescription("Gym membership fee & admin fee")
        break
    }
  }, [paymentType])

  const getAmount = (type: PaymentType): number => {
    switch (type) {
      case "membership":
        return 120
      case "admin":
        return 50
      case "both":
        return 170
      default:
        return 120
    }
  }

  const validateSession = async (): Promise<boolean> => {
    try {
      console.log("[v0] UploadPage: Validating session...")
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("[v0] UploadPage: Session validation error:", error)
        return false
      }

      if (!session) {
        console.log("[v0] UploadPage: No active session found")
        return false
      }

      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log("[v0] UploadPage: Session expired")
        return false
      }

      console.log("[v0] UploadPage: Session is valid")
      return true
    } catch (error) {
      console.error("[v0] UploadPage: Session validation failed:", error)
      return false
    }
  }

  useEffect(() => {
    console.log("[v0] UploadPage useEffect: loading =", loading, ", user =", user)

    if (!loading && !user) {
      console.log("[v0] UploadPage: User not authenticated, redirecting to auth.")
      router.push("/auth")
      return
    }

    if (user && !user.profile_picture_url) {
      toast({
        title: "Profile Picture Required",
        description: "Please upload a profile picture before uploading receipts.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }

    if (user) {
      console.log("[v0] UploadPage: User authenticated, validating session")
      validateSession().then(setSessionValid)
    }
  }, [user, loading, router, toast])

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        console.log("[v0] UploadPage: Tab became visible, checking session...")
        setSessionChecking(true)

        try {
          const isValid = await validateSession()
          setSessionValid(isValid)

          if (!isValid) {
            console.log("[v0] UploadPage: Session invalid after tab focus, redirecting to auth")
            toast({
              title: "Session Expired",
              description: "Please log in again to continue.",
              variant: "destructive",
            })
            router.push("/auth")
          } else {
            console.log("[v0] UploadPage: Session valid after tab focus")
          }
        } catch (error) {
          console.error("[v0] UploadPage: Error checking session on tab focus:", error)
          setSessionValid(false)
        } finally {
          setSessionChecking(false)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user, router, toast])

  useEffect(() => {
    if (!user) return

    const sessionCheckInterval = setInterval(
      async () => {
        try {
          console.log("[v0] UploadPage: Periodic session check...")
          const isValid = await validateSession()
          setSessionValid(isValid)

          if (!isValid && !isUploading) {
            console.warn("[v0] UploadPage: Session invalid during periodic check")
          }
        } catch (error) {
          console.error("[v0] UploadPage: Error in periodic session check:", error)
        }
      },
      5 * 60 * 1000,
    ) // Check every 5 minutes

    return () => {
      clearInterval(sessionCheckInterval)
    }
  }, [user, isUploading])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        })
        return
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPG, PNG, or PDF file.",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    console.log("[v0] UploadPage: Validating session before upload")
    const isSessionValid = await validateSession()

    if (!isSessionValid) {
      toast({
        title: "Session Expired",
        description: "Please log in again to upload receipts.",
        variant: "destructive",
      })
      router.push("/auth")
      return
    }

    setIsUploading(true)

    try {
      const amount = getAmount(paymentType)
      const isAdminFee = paymentType === "admin" || paymentType === "both"
      const { receipt, error } = await uploadReceipt(file, amount, description, isAdminFee)

      if (error) {
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (receipt) {
        setUploadSuccess(true)
        toast({
          title: "Upload Successful!",
          description: "Your receipt has been uploaded and is pending verification.",
        })

        setTimeout(() => {
          setUploadSuccess(false)
          setFile(null)
          setPaymentType("membership")
          setDescription("Gym membership fee")
          router.push("/dashboard")
        }, 2000)
      }
    } catch (error) {
      console.error("[v0] UploadPage: Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!user.profile_picture_url) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <User className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Profile Picture Required</h2>
          <p className="text-gray-600 mb-6">Please upload a profile picture before you can upload receipts.</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-orange-600 hover:bg-orange-700">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
            <p className="text-sm sm:text-base text-gray-600">
              Your receipt has been uploaded and is pending verification.
            </p>
            <p className="text-xs text-gray-500">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Sam24Fit</h1>
            </div>
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="self-start sm:self-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">Back to Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-6 sm:py-8 px-4">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Upload Receipt</h2>
          <p className="text-sm sm:text-base text-gray-600">Upload your payment receipt for verification</p>
          {sessionChecking && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">Checking session status...</p>
            </div>
          )}
          {!sessionValid && !sessionChecking && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800">
                Session validation in progress... If this persists, please refresh the page.
              </p>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Payment Receipt Upload
            </CardTitle>
            <CardDescription>Please upload a clear image or PDF of your payment receipt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-3 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Bank Account Details for Payments
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-green-300">
                  <div className="flex items-center mb-3">
                    <div className="bg-green-600 text-white p-1.5 rounded mr-2">
                      <CreditCard className="h-3 w-3" />
                    </div>
                    <h4 className="font-semibold text-green-900">Business Account (Primary)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-green-800">Account Nickname:</span>
                      <div className="text-gray-900">Sam24fit</div>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Account Number:</span>
                      <div className="text-gray-900 font-semibold">1052 6463 87</div>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Bank:</span>
                      <div className="text-gray-900">First National Bank (FNB)</div>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Account Type:</span>
                      <div className="text-gray-900">Transact</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-300">
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-600 text-white p-1.5 rounded mr-2">
                      <User className="h-3 w-3" />
                    </div>
                    <h4 className="font-semibold text-blue-900">Personal Account (Alternative)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Account Holder:</span>
                      <div className="text-gray-900">MR SG NXUMALO</div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Account Number:</span>
                      <div className="text-gray-900 font-semibold">1278512703</div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Bank:</span>
                      <div className="text-gray-900">Capitec Bank</div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Account Type:</span>
                      <div className="text-gray-900">Personal Debit</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-3">
                <strong>Reference:</strong> Use "{user?.full_name || "Your Name"} - Membership" when making payment to
                either account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt File *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  <input
                    id="receipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label htmlFor="receipt" className="cursor-pointer">
                    {file ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-8 w-8 text-orange-600" />
                        <span className="text-gray-900">{file.name}</span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Click to upload receipt</p>
                        <p className="text-sm text-gray-500">PNG, JPG, or PDF up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Payment Type *</Label>
                <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="membership" id="membership" />
                      <Label htmlFor="membership" className="flex-1 cursor-pointer">
                        <div className="text-center">
                          <div className="font-medium">Membership</div>
                          <div className="font-semibold text-orange-600">R120</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="admin" id="admin" />
                      <Label htmlFor="admin" className="flex-1 cursor-pointer">
                        <div className="text-center">
                          <div className="font-medium">Admin Fee</div>
                          <div className="font-semibold text-orange-600">R50</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both" className="flex-1 cursor-pointer">
                        <div className="text-center">
                          <div className="font-medium">Both</div>
                          <div className="font-semibold text-orange-600">R170</div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                  rows={2}
                />
                <p className="text-xs text-gray-500">Description is automatically set based on payment type</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={!file || isUploading || sessionChecking}
              >
                {isUploading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Uploading...</span>
                  </>
                ) : sessionChecking ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Checking Session...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Receipt - R{getAmount(paymentType)}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Upload Guidelines:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure the receipt is clear and readable</li>
                <li>• Include the full receipt showing amount and date</li>
                <li>• Accepted formats: PNG, JPG, PDF</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Processing time: 1-2 business days</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
