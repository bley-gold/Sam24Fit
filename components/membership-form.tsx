"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, User, MapPin, Heart, CheckCircle, AlertCircle, Camera } from "lucide-react"

interface FormData {
  // Personal Information
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  idNumber: string

  // Address
  streetAddress: string
  city: string
  province: string
  zipCode: string

  // Health & Fitness
  emergencyContactName: string
  emergencyContactNumber: string

  profilePicture: File | null
}

interface FormErrors {
  [key: string]: string
}

export function MembershipForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    idNumber: "",
    streetAddress: "",
    city: "",
    province: "",
    zipCode: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    profilePicture: null,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Personal Information validation
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^\+?[\d\s\-$$$$]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number"
    }
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
    if (!formData.gender) newErrors.gender = "Please select your gender"
    if (!formData.idNumber.trim()) newErrors.idNumber = "ID Number/Passport is required"

    // Address validation
    if (!formData.streetAddress.trim()) newErrors.streetAddress = "Street address is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.province.trim()) newErrors.province = "Province/State is required"
    if (!formData.zipCode.trim()) newErrors.zipCode = "Zip/Postal code is required"

    // Emergency contact validation
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = "Emergency contact name is required"
    if (!formData.emergencyContactNumber.trim()) {
      newErrors.emergencyContactNumber = "Emergency contact number is required"
    } else if (!/^\+?[\d\s\-$$$$]{10,}$/.test(formData.emergencyContactNumber)) {
      newErrors.emergencyContactNumber = "Please enter a valid phone number"
    }

    // Terms and conditions validation
    if (!termsAccepted) {
      newErrors.terms = "You must accept the terms and conditions to proceed"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, profilePicture: "Please select a valid image file" }))
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, profilePicture: "Image size must be less than 5MB" }))
        return
      }

      setFormData((prev) => ({ ...prev, profilePicture: file }))

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Clear any existing error
      if (errors.profilePicture) {
        setErrors((prev) => ({ ...prev, profilePicture: "" }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-4">
              Welcome to our gym family! We'll contact you within 24 hours to complete your membership setup.
            </p>
            <Badge className="bg-green-100 text-green-800">Membership Pending Activation</Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Dumbbell className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">FitLife Gym</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Membership Registration</h2>
          <p className="text-gray-600">Join our fitness community and start your transformation journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>Please provide your basic personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number / Passport *</Label>
                  <Input
                    id="idNumber"
                    placeholder="Enter your ID number or passport"
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange("idNumber", e.target.value)}
                    className={errors.idNumber ? "border-red-500" : ""}
                  />
                  {errors.idNumber && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.idNumber}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className={errors.dateOfBirth ? "border-red-500" : ""}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.gender}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profilePicture">Profile Photo</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="profilePicture"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview || "/placeholder.svg"}
                            alt="Profile preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Camera className="w-8 h-8 mb-4 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> profile photo
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                          </div>
                        )}
                        <input
                          id="profilePicture"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                {errors.profilePicture && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.profilePicture}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Upload a clear photo for your membership ID. This will be used for identification purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Address Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>Address Information</span>
              </CardTitle>
              <CardDescription>Please provide your current address details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Residential Address *</Label>
                <Input
                  id="streetAddress"
                  placeholder="123 Main Street, Apt 4B"
                  value={formData.streetAddress}
                  onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                  className={errors.streetAddress ? "border-red-500" : ""}
                />
                {errors.streetAddress && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.streetAddress}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.city}
                    </p>
                  )}
                </div>

                {/* Province/State */}
                <div className="space-y-2">
                  <Label htmlFor="province">Province / State *</Label>
                  <Input
                    id="province"
                    placeholder="NY"
                    value={formData.province}
                    onChange={(e) => handleInputChange("province", e.target.value)}
                    className={errors.province ? "border-red-500" : ""}
                  />
                  {errors.province && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.province}
                    </p>
                  )}
                </div>

                {/* Zip Code */}
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip / Postal Code *</Label>
                  <Input
                    id="zipCode"
                    placeholder="10001"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    className={errors.zipCode ? "border-red-500" : ""}
                  />
                  {errors.zipCode && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.zipCode}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health & Fitness Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-blue-600" />
                <span>Health & Emergency Contact</span>
              </CardTitle>
              <CardDescription>Emergency contact information for your safety</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emergency Contact Name */}
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContactName"
                    placeholder="John Doe"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                    className={errors.emergencyContactName ? "border-red-500" : ""}
                  />
                  {errors.emergencyContactName && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.emergencyContactName}
                    </p>
                  )}
                </div>

                {/* Emergency Contact Number */}
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactNumber">Emergency Contact Number *</Label>
                  <Input
                    id="emergencyContactNumber"
                    placeholder="+1 (555) 987-6543"
                    value={formData.emergencyContactNumber}
                    onChange={(e) => handleInputChange("emergencyContactNumber", e.target.value)}
                    className={errors.emergencyContactNumber ? "border-red-500" : ""}
                  />
                  {errors.emergencyContactNumber && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.emergencyContactNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Important Note:</h4>
                <p className="text-sm text-blue-800">
                  Your emergency contact will only be contacted in case of a medical emergency or urgent situation at
                  the gym. Please ensure this person is aware they are listed as your emergency contact.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span>Terms and Conditions</span>
              </CardTitle>
              <CardDescription>Please review and accept our membership agreement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-lg border max-h-64 overflow-y-auto">
                <h4 className="font-semibold text-gray-900 mb-4">MEMBERSHIP AGREEMENT</h4>
                <p className="text-sm text-gray-700 mb-4 italic">
                  (This is a legally binding document. Please read carefully.)
                </p>

                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">SHORT RULES OF THE GYM (HOUSE RULES)</h5>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Train at your own risk.</li>
                      <li>Arrange the equipment after use.</li>
                      <li>Respect other members and staff.</li>
                      <li>No inappropriate behavior or language.</li>
                      <li>Proper gym attire is required.</li>
                      <li>Report damaged equipment immediately. If you damage anything in the gym, you will pay.</li>
                      <li>Management reserves the right to cancel membership due to rule violations.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">DISCLAIMER / INDEMNITY</h5>
                    <p className="mb-2 text-sm text-gray-700">
                      I, the undersigned member, understand and acknowledge that:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>
                        I am voluntarily participating in physical activities at this gym, and I do so entirely at my
                        own risk.
                      </li>
                      <li>
                        The owner(s), staff, and affiliates of the gym are not liable for any injury, illness, death, or
                        loss/damage to personal property that may occur on the premises, including but not limited to
                        use of equipment, facilities, or participation in training activities.
                      </li>
                      <li>I have consulted a medical professional if necessary, and I am physically fit to train.</li>
                      <li>
                        I agree to follow the gym's rules and understand that a violation may result in the termination
                        of my membership without refund.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    if (errors.terms) {
                      setErrors((prev) => ({ ...prev, terms: "" }))
                    }
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="termsAccepted" className="text-sm text-gray-700 leading-relaxed">
                  I have read, understood, and agree to the membership agreement, gym rules, and disclaimer above. I
                  acknowledge that this is a legally binding document and that I am signing it voluntarily. *
                </label>
              </div>

              {errors.terms && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.terms}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !termsAccepted}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Registration...
                    </>
                  ) : (
                    <>
                      <Dumbbell className="h-4 w-4 mr-2" />
                      Complete Registration
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By submitting this form, you agree to our terms of service and privacy policy. All fields marked with
                  * are required.
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
