"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { signIn, signUp, type SignUpData, type SignInData } from "@/lib/auth"
import { Dumbbell, Shield, Upload, Users, User, MapPin, Heart, ArrowLeft, AlertCircle } from "lucide-react"
import { useAuthContext } from "@/components/auth-provider"

export default function AuthPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [formSubmitting, setFormSubmitting] = useState(false) // Renamed 'loading' to 'formSubmitting'
  const { user, loading: authLoading } = useAuthContext() // Get user and authLoading from context

  const [loginData, setLoginData] = useState<SignInData>({ email: "", password: "" })
  const [signupData, setSignupData] = useState<Omit<SignUpData, "profilePicture"> & { profilePicture: File | null }>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    streetAddress: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    profilePicture: null,
  })
  const [ageError, setAgeError] = useState("")

  // Effect to redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

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
    setFormSubmitting(true) // Use formSubmitting

    try {
      const { user, error } = await signIn(loginData)

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (user) {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        })
        // The useEffect above will handle the redirect
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormSubmitting(false) // Use formSubmitting
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check age validation
    if (signupData.dateOfBirth) {
      const age = calculateAge(signupData.dateOfBirth)
      if (age < 15) {
        setAgeError("You must be at least 15 years old to join Sam24Fit")
        return
      }
    }

    if (!signupData.profilePicture) {
      toast({
        title: "Profile Picture Required",
        description: "Please upload a profile picture to continue.",
        variant: "destructive",
      })
      return
    }

    setFormSubmitting(true) // Use formSubmitting

    try {
      const { user, error } = await signUp({
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
        toast({
          title: "Registration Successful!",
          description: "Welcome to Sam24Fit! Please check your email to verify your account.",
        })
        // The useEffect above will handle the redirect
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormSubmitting(false) // Use formSubmitting
    }
  }

  // Show loading spinner if authentication state is still being determined
  if (authLoading) {
    // Use authLoading here
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." /> {/* Changed text to be generic */}
      </div>
    )
  }

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
            <Button variant="outline" className="hover:bg-orange-50 bg-transparent" onClick={() => router.push("/")}>
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
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                    disabled={formSubmitting} // Use formSubmitting
                  >
                    {formSubmitting ? <LoadingSpinner size="sm" /> : "Login"}
                  </Button>
                </form>
                {/* Removed demo account display */}
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
                      <Label htmlFor="profilePicture">Profile Picture *</Label>
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
                          required
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

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password *</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        className="focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 mt-6 shadow-lg"
                    disabled={!!ageError || formSubmitting} // Use formSubmitting
                  >
                    {formSubmitting ? ( // Use formSubmitting
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
