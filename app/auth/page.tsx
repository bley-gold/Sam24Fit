"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { signIn, signUp, resetPassword, type SignUpData, type SignInData } from "@/lib/auth"
import {
  Dumbbell,
  Shield,
  Upload,
  Users,
  User,
  MapPin,
  Heart,
  ArrowLeft,
  AlertCircle,
  Mail,
  CheckCircle,
  KeyRound,
} from "lucide-react"
import { useAuthContext } from "@/components/auth-provider"
import { testEnvironmentVariables } from "@/app/actions/test-env-action"

export default function AuthPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [formSubmitting, setFormSubmitting] = useState(false)
  const { user, loading: authLoading, refreshUser } = useAuthContext()
  const [testEnvLoading, setTestEnvLoading] = useState(false)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState("")
  const [forceShowAuth, setForceShowAuth] = useState(false)
  const redirectAttempted = useRef(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordSubmitting, setForgotPasswordSubmitting] = useState(false)
  const [ageError, setAgeError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showGymRules, setShowGymRules] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [loginData, setLoginData] = useState<SignInData>({ email: "", password: "" })
  const [signupData, setSignupData] = useState<
    Omit<SignUpData, "profilePicture"> & { profilePicture: File | null; confirmPassword: string }
  >({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    streetAddress: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    profilePicture: null,
    idNumber: "",
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const confirmed = urlParams.get("confirmed")
    const message = urlParams.get("message")
    const error = urlParams.get("error")

    if (confirmed === "true" && message) {
      toast({
        title: "Email Confirmed! ✅",
        description: message,
      })
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error && message) {
      toast({
        title: "Authentication Error",
        description: message,
        variant: "destructive",
      })
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [toast])

  // Force show auth form after timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("AuthPage: Forcing auth form to show after timeout")
      setForceShowAuth(true)
    }, 15000) // Extended timeout from 5 to 15 seconds to reduce premature warnings

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    console.log("AuthPage useEffect: authLoading =", authLoading, ", user =", user)

    if (redirectAttempted.current) {
      console.log("AuthPage: Redirect already attempted, skipping")
      return
    }

    // Hide email confirmation if user is authenticated
    if (!authLoading && user && showEmailConfirmation) {
      console.log("AuthPage: User is authenticated, hiding email confirmation screen")
      setShowEmailConfirmation(false)
    }

    // Redirect authenticated users
    if (!authLoading && user) {
      console.log("AuthPage: User logged in, checking role for redirect")
      redirectAttempted.current = true

      // Check if user is admin and redirect accordingly
      if (user.role === "admin" || user.email === "goldstainmusic22@gmail.com") {
        console.log("AuthPage: Admin user detected, redirecting to admin dashboard")
        router.push("/admin")
      } else {
        console.log("AuthPage: Regular user, redirecting to user dashboard")
        router.push("/dashboard")
      }
    }
  }, [user, authLoading, router, showEmailConfirmation])

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  const handleDateOfBirthChange = (value: string) => {
    setSignupData({ ...signupData, dateOfBirth: value })

    if (value) {
      const age = calculateAge(value)
      if (age < 15) {
        setAgeError("You must be at least 15 years old to join Sam24Fit")
      } else {
        setAgeError("")
      }
    } else {
      setAgeError("")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)

    try {
      const { user, error, userRole, isAdmin } = await signIn(loginData)

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (user) {
        console.log("AuthPage: Login successful for user:", user.email)
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        })

        redirectAttempted.current = true

        // Redirect based on user role from JWT (more reliable than profile data)
        if (isAdmin) {
          console.log("AuthPage: Admin user detected, redirecting to admin dashboard")
          router.push("/admin")
        } else {
          console.log("AuthPage: Regular user, redirecting to user dashboard")
          router.push("/dashboard")
        }
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleSignup = async () => {
    console.log("[v0] Starting signup process")
    setIsLoading(true)

    // Validate required fields
    if (
      !signupData.email ||
      !signupData.password ||
      !signupData.fullName ||
      !signupData.phone ||
      !signupData.dateOfBirth ||
      !signupData.gender ||
      !signupData.streetAddress ||
      !signupData.emergencyContactName ||
      !signupData.emergencyContactNumber ||
      !signupData.idNumber
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Validate password confirmation
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    setFormSubmitting(true)

    try {
      const { user, error, needsEmailConfirmation, message } = await signUp({
        ...signupData,
        profilePicture: signupData.profilePicture,
      })

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (user) {
        console.log("AuthPage: Signup successful for user:", user.email)

        if (needsEmailConfirmation) {
          setConfirmationEmail(user.email || "")
          setShowEmailConfirmation(true)
          toast({
            title: "Registration Successful!",
            description: message || "Please check your email to verify your account.",
          })
        } else {
          toast({
            title: "Registration Successful!",
            description: message || "Welcome to Sam24Fit! You can now access your account.",
          })
          // The useEffect above will handle the redirect if user is already logged in
        }
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormSubmitting(false)
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordSubmitting(true)

    try {
      const { error, message } = await resetPassword(forgotPasswordEmail)

      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      })

      setShowForgotPassword(false)
      setForgotPasswordEmail("")
    } catch (error) {
      toast({
        title: "Password Reset Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setForgotPasswordSubmitting(false)
    }
  }

  const handleTestEnv = async () => {
    setTestEnvLoading(true)
    const result = await testEnvironmentVariables()
    toast({
      title: "Environment Test Result",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    setTestEnvLoading(false)
  }

  const generateGymRules = () => {
    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    return `MEMBERSHIP AGREEMENT
(This is a legally binding document. Please read carefully.)

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

This agreement will be digitally accepted through the Sam24Fit registration system.`
  }

  // Show loading spinner only if authentication is loading AND we haven't forced show yet
  if (authLoading && !forceShowAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading authentication..." />
          <p className="mt-4 text-gray-600">If this takes too long, there might be a configuration issue.</p>
          <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setForceShowAuth(true)}>
            Continue Anyway
          </Button>
        </div>
      </div>
    )
  }

  // Show email confirmation screen
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 p-2 rounded-lg">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Sam24Fit
                </h1>
              </div>
              <Button
                variant="outline"
                className="hover:bg-orange-50 bg-transparent"
                onClick={() => setShowEmailConfirmation(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>
        </header>

        {/* Email Confirmation Content */}
        <main className="max-w-md mx-auto pt-16 px-4">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription className="text-lg">
                We've sent a confirmation link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">{confirmationEmail}</p>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Click the confirmation link in your email to activate your account</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Once confirmed, you can log in with your credentials</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Check your spam folder if you don't see the email</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm text-yellow-800 font-medium">Email Not Arriving?</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        If you don't receive the email within 5 minutes, it might be a configuration issue. Contact
                        support or try signing up again.
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowEmailConfirmation(false)} className="w-full">
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Show forgot password screen
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 p-2 rounded-lg">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Sam24Fit
                </h1>
              </div>
              <Button
                variant="outline"
                className="hover:bg-orange-50 bg-transparent"
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>
        </header>

        {/* Forgot Password Content */}
        <main className="max-w-md mx-auto pt-16 px-4">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <KeyRound className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Reset Your Password</CardTitle>
              <CardDescription className="text-lg">
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="your@email.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                    className="focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                  disabled={forgotPasswordSubmitting}
                >
                  {forgotPasswordSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• We'll send a password reset link to your email</li>
                      <li>• Click the link to create a new password</li>
                      <li>• Use your new password to log in</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Sam24Fit
              </h1>
            </div>
            <Button
              variant="outline"
              className="hover:bg-orange-50 bg-transparent relative z-10"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pt-16 px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Payment Gateway
          </h2>
          <p className="text-gray-600">Manage your gym payments securely</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Access Your Account</CardTitle>
            <CardDescription className="text-center text-lg">
              Login or create a new account to manage your payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div className="flex justify-end mb-4">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-orange-600 hover:text-orange-700 underline font-medium"
                    >
                      Forgot your password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? <LoadingSpinner size="sm" /> : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="h-5 w-5 mr-2 text-orange-600" />
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="Enter your full name"
                          value={signupData.fullName}
                          onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                          required
                          className="focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="idNumber">ID Number / Passport *</Label>
                        <Input
                          id="idNumber"
                          placeholder="Enter your ID number or passport"
                          value={signupData.idNumber || ""}
                          onChange={(e) => setSignupData({ ...signupData, idNumber: e.target.value })}
                          required
                          className="focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email Address *</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          required
                          className="focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          placeholder="+27 67 993 4104"
                          value={signupData.phone}
                          onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                          required
                          className="focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={signupData.dateOfBirth}
                          onChange={(e) => handleDateOfBirthChange(e.target.value)}
                          className={
                            ageError
                              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                              : "focus:ring-orange-500 focus:border-orange-500"
                          }
                          required
                        />
                        {ageError && (
                          <p className="text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {ageError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <select
                        id="gender"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        value={signupData.gender}
                        onChange={(e) => setSignupData({ ...signupData, gender: e.target.value })}
                        required
                      >
                        <option value="">Select your gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profilePicture">Profile Picture (Optional)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors bg-gradient-to-br from-orange-50 to-red-50">
                        <input
                          id="profilePicture"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSignupData({ ...signupData, profilePicture: e.target.files[0] })
                            }
                          }}
                          className="hidden"
                        />
                        <label htmlFor="profilePicture" className="cursor-pointer">
                          {signupData.profilePicture ? (
                            <div className="flex items-center justify-center space-x-2">
                              <User className="h-8 w-8 text-orange-600" />
                              <span className="text-gray-900 font-medium">{signupData.profilePicture.name}</span>
                            </div>
                          ) : (
                            <div>
                              <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600 mb-1 font-medium">Click to upload profile picture</p>
                              <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Address Information Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                      Address Information
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="streetAddress">Street Address *</Label>
                      <Input
                        id="streetAddress"
                        placeholder="123 Main Street, Apt 4B"
                        value={signupData.streetAddress}
                        onChange={(e) => setSignupData({ ...signupData, streetAddress: e.target.value })}
                        required
                        className="focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Health & Emergency Contact Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-orange-600" />
                      Emergency Contact
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                        <Input
                          id="emergencyContactName"
                          placeholder="John Doe"
                          value={signupData.emergencyContactName}
                          onChange={(e) => setSignupData({ ...signupData, emergencyContactName: e.target.value })}
                          required
                          className="focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactNumber">Emergency Contact Number *</Label>
                        <Input
                          id="emergencyContactNumber"
                          placeholder="+27 67 993 4104"
                          value={signupData.emergencyContactNumber}
                          onChange={(e) => setSignupData({ ...signupData, emergencyContactNumber: e.target.value })}
                          required
                          className="focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800">
                        <strong>Important:</strong> Your emergency contact will only be contacted in case of a medical
                        emergency at the gym.
                      </p>
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-orange-600" />
                      Account Security
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password *</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupData.password}
                          onChange={(e) => {
                            setSignupData({ ...signupData, password: e.target.value })
                            if (passwordError) setPasswordError("")
                          }}
                          required
                          className="focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password *</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupData.confirmPassword}
                          onChange={(e) => {
                            setSignupData({ ...signupData, confirmPassword: e.target.value })
                            if (passwordError) setPasswordError("")
                          }}
                          required
                          className={
                            passwordError
                              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                              : "focus:ring-orange-500 focus:border-orange-500"
                          }
                        />
                        {passwordError && (
                          <p className="text-sm text-red-600 flex items-center mt-1">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {passwordError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Password Requirements:</strong> Use a strong password with at least 8 characters for
                        better security.
                      </p>
                    </div>
                  </div>

                  {/* Terms and Conditions Checkbox */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Gym Rules & Agreement</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowGymRules(!showGymRules)}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          {showGymRules ? "Hide Rules" : "View Rules"}
                        </Button>
                      </div>

                      {showGymRules && (
                        <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto border border-gray-200 relative z-0">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                            {generateGymRules()}
                          </pre>
                        </div>
                      )}

                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-800">
                          <strong>Important:</strong> Please review the gym rules and membership agreement above before
                          proceeding with registration.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        id="acceptTerms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
                        I have read and accept the gym rules and membership agreement above, as well as the{" "}
                        <button
                          type="button"
                          onClick={() => setShowGymRules(true)}
                          className="text-orange-600 hover:text-orange-700 underline"
                        >
                          Terms and Conditions
                        </button>{" "}
                        and{" "}
                        <a
                          href="/privacy"
                          target="_blank"
                          className="text-orange-600 hover:text-orange-700 underline"
                          rel="noreferrer"
                        >
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 mt-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!!ageError || !!passwordError || formSubmitting || !acceptedTerms}
                  >
                    {formSubmitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Dumbbell className="h-4 w-4 mr-2" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
            <Shield className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-medium text-gray-900">Secure Payments</h3>
              <p className="text-sm text-gray-600">Your payment information is protected</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
            <Upload className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">Easy Upload</h3>
              <p className="text-sm text-gray-600">Upload receipts with just a few clicks</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
            <Users className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="font-medium text-gray-900">Member Support</h3>
              <p className="text-sm text-gray-600">24/7 support for all members</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
