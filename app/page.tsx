"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dumbbell,
  Clock,
  Trophy,
  Users,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Heart,
  Camera,
  CheckCircle,
  Star,
  BookOpen,
  MessageCircle,
} from "lucide-react"
import Image from "next/image"
import { getApprovedReviews } from "@/app/actions/review-actions"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    const fetchReviews = async () => {
      console.log("[v0] Starting to fetch reviews...")
      try {
        const result = await getApprovedReviews()
        console.log("[v0] getApprovedReviews result:", result)

        if (result.success) {
          console.log("[v0] Reviews fetched successfully:", result.data)
          console.log("[v0] Number of reviews:", result.data?.length || 0)
          const featuredReviews = result.data?.filter((review) => review.is_featured === true) || []
          console.log("[v0] Featured reviews:", featuredReviews)
          console.log("[v0] Number of featured reviews:", featuredReviews.length)
          setReviews(result.data || [])
        } else {
          console.log("[v0] Failed to fetch reviews:", result.error)
        }
      } catch (error) {
        console.log("[v0] Error in fetchReviews:", error)
      }
    }
    fetchReviews()
  }, [])

  const handleGetStarted = () => {
    window.location.href = "/auth"
  }

  const handleOurStory = () => {
    window.location.href = "/our-story"
  }

  const handleContact = () => {
    const message = encodeURIComponent(
      "Hi Sam! I'm interested in joining Sam24Fit gym. Can you please tell me more about membership and getting started?",
    )
    window.open(`https://wa.me/27679934104?text=${message}`, "_blank")
  }

  const handleFacilities = () => {
    window.location.href = "/gallery"
  }

  const handleMembership = () => {
    window.location.href = "/auth"
  }

  const galleryImages = [
    { id: 1, title: "State-of-the-art Equipment", category: "Equipment" },
    { id: 2, title: "Spacious Workout Area", category: "Facility" },
    { id: 3, title: "Cardio Zone", category: "Equipment" },
    { id: 4, title: "Free Weights Section", category: "Equipment" },
    { id: 5, title: "Group Training Area", category: "Classes" },
    { id: 6, title: "Community Vibes", category: "Facility" },
    { id: 7, title: "Functional Training", category: "Training" },
    { id: 8, title: "Members in Action", category: "Community" },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Dumbbell className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sam24Fit</h1>
                <p className="text-xs text-gray-500">Pretoria Fitness</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600" onClick={handleGetStarted}>
                Member Login
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6" onClick={handleGetStarted}>
                Join Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 relative overflow-hidden">
        <div className="absolute top-10 right-10 opacity-10 rotate-12">
          <Image
            src="/urban-fitness-graffiti.png"
            alt="Urban fitness vibe"
            width={300}
            height={200}
            className="object-contain"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
                🏆 Pretoria's Community Gym
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Fitness
                <span className="text-blue-600 block">Journey Starts</span>
                <span className="text-purple-600">Here</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Join Sam24Fit and become part of our tight-knit fitness family in the heart of Pretoria. Real people,
                real results, real community.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4" onClick={handleGetStarted}>
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 border-gray-300 hover:bg-gray-50 bg-transparent"
                onClick={handleOurStory}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Our Story
              </Button>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">120+</div>
                <div className="text-sm text-gray-500">Active Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">R120</div>
                <div className="text-sm text-gray-500">Per Month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">6</div>
                <div className="text-sm text-gray-500">Days a Week</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl p-8 text-white">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Monthly Membership</h3>
                    <p className="opacity-90">Everything you need to succeed</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">R120</div>
                    <div className="text-sm opacity-75">/month</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5" />
                    <span>Full gym access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5" />
                    <span>All equipment included</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5" />
                    <span>Community support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5" />
                    <span>Personal guidance</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3"
                  onClick={handleGetStarted}
                >
                  Get Started Today
                </Button>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-full p-3 shadow-lg">
              <Trophy className="h-6 w-6 text-yellow-800" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-green-400 rounded-full p-3 shadow-lg">
              <Heart className="h-6 w-6 text-green-800" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Sam24Fit?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're more than just a gym - we're your neighborhood fitness family where everyone knows your name.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Flexible Hours</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Open Mon-Fri 5:30-8 and Sat 6:30-6. Train when it works for your schedule, whether you're an early
                  bird or after-work warrior.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Community Spirit</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Join a family of 120+ members who support each other's goals. Real friendships, real motivation, real
                  results together.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Personal Touch</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Sam knows every member personally. Get the guidance and encouragement you need to reach your fitness
                  goals in a welcoming space.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting started with Sam24Fit is simple. Follow these easy steps to begin your fitness journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Steps */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign Up Online</h3>
                  <p className="text-gray-600">
                    Create your account on our website and fill in your personal details to get started.
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-blue-600 mt-2 hidden lg:block" />
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Make Payment</h3>
                  <p className="text-gray-600">
                    Transfer your membership fee to our bank account using the details provided below.
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-purple-600 mt-2 hidden lg:block" />
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Receipt</h3>
                  <p className="text-gray-600">
                    Upload your payment receipt through your dashboard for verification by our team.
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-green-600 mt-2 hidden lg:block" />
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Training</h3>
                  <p className="text-gray-600">
                    Once approved, you're ready to start your fitness journey at Sam24Fit!
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="lg:sticky lg:top-8">
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="bg-blue-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                    <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 6h20v2H2zm0 5h20v7H2z" />
                      <circle cx="6" cy="16" r="1" />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl text-gray-900">Payment Details</CardTitle>
                  <CardDescription className="text-base">
                    Use these bank details to make your membership payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Bank:</span>
                      <span className="text-gray-900 font-semibold">First National Bank (FNB)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Account Name:</span>
                      <span className="text-gray-900 font-semibold">Sam24Fit Gym</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Account Number:</span>
                      <span className="text-gray-900 font-semibold font-mono">62847291056</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Branch Code:</span>
                      <span className="text-gray-900 font-semibold font-mono">250655</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Account Type:</span>
                      <span className="text-gray-900 font-semibold">Business Cheque</span>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Payment Reference:</h4>
                    <p className="text-yellow-700 text-sm">Use your full name and phone number as reference</p>
                    <p className="text-yellow-700 text-sm font-mono">Example: "John Smith 0821234567"</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Monthly Fee:</h4>
                    <p className="text-2xl font-bold text-blue-600">R120.00</p>
                    <p className="text-blue-700 text-sm">+ R50 joining fee (first payment only)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Take a Look Inside</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Check out our community space where neighbors become training partners and fitness goals become reality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleryImages.map((image, index) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-2xl bg-gray-200 aspect-square hover:scale-105 transition-transform duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-80 group-hover:opacity-60 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-white opacity-60" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <Badge className="bg-white/20 text-white mb-2 text-xs">{image.category}</Badge>
                  <h3 className="font-semibold text-sm">{image.title}</h3>
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="px-8 bg-transparent" onClick={handleFacilities}>
              <Camera className="mr-2 h-5 w-5" />
              View Full Gallery
            </Button>
          </div>
        </div>
      </section>

      {/* Floating Review Bubbles Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Members Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real experiences from our amazing Sam24Fit community
            </p>
          </div>

          <div className="relative h-96">
            {(() => {
              const featuredReviews = reviews.filter((review) => review.is_featured === true)
              const displayReviews = featuredReviews

              console.log("[v0] All reviews:", reviews)
              console.log("[v0] Featured reviews for display:", featuredReviews)

              if (displayReviews.length === 0 && reviews.length > 0) {
                return (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-500 text-lg">No featured reviews to display</p>
                  </div>
                )
              }

              if (displayReviews.length === 0) {
                return (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-500 text-lg">No reviews available yet</p>
                  </div>
                )
              }

              const generatePositions = (count: number) => {
                if (count === 0) return []
                if (count === 1) return [{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }]
                if (count === 2)
                  return [
                    { top: "40%", left: "25%", transform: "translate(-50%, -50%)" },
                    { top: "60%", right: "25%", transform: "translate(50%, -50%)" },
                  ]

                const positions = []
                const sections = Math.ceil(count / 4) // Divide into vertical sections
                const itemsPerSection = Math.ceil(count / sections)

                for (let i = 0; i < count; i++) {
                  const sectionIndex = Math.floor(i / itemsPerSection)
                  const itemInSection = i % itemsPerSection

                  // Calculate vertical position based on section
                  const sectionHeight = 100 / sections
                  const sectionStart = sectionIndex * sectionHeight
                  const sectionCenter = sectionStart + sectionHeight / 2

                  // Add some vertical variation within the section
                  const verticalVariation = itemInSection % 2 === 0 ? -15 : 15
                  const top = Math.max(10, Math.min(90, sectionCenter + verticalVariation))

                  // Calculate horizontal position with more even distribution
                  const horizontalSections = Math.min(4, Math.ceil(count / 2))
                  const horizontalIndex = i % horizontalSections
                  const horizontalSpacing = 80 / (horizontalSections - 1 || 1)
                  const left = 10 + horizontalIndex * horizontalSpacing

                  // Add slight random offset for natural look
                  const randomOffsetX = Math.sin(i * 2.5) * 8
                  const randomOffsetY = Math.cos(i * 1.8) * 8

                  positions.push({
                    top: `${Math.max(5, Math.min(85, top + randomOffsetY))}%`,
                    left: `${Math.max(5, Math.min(85, left + randomOffsetX))}%`,
                    transform: "translate(-50%, -50%)",
                  })
                }

                return positions
              }

              const positions = generatePositions(displayReviews.length)

              return displayReviews.map((review, index) => {
                const position = positions[index]

                return (
                  <div
                    key={review.id}
                    className="absolute animate-float z-10 hover:z-[999]"
                    style={{
                      ...position,
                      animationDelay: `${index * 0.5}s`,
                      animationDuration: `${4 + (index % 3)}s`,
                    }}
                  >
                    <div
                      className={`bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 max-w-xs group hover:scale-110 cursor-pointer hover:rotate-1`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Image
                          src={
                            review.users?.profile_picture_url ||
                            "/placeholder.svg?height=40&width=40&query=user profile" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={review.users?.full_name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {review.users?.full_name || "Anonymous"}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">{review.review_text}</p>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </section>

      {/* Operating Hours */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">When We're Open</h2>
            <p className="text-xl text-gray-600">Convenient hours designed around your lifestyle</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Monday - Friday</h3>
                <p className="text-2xl font-bold text-blue-600">5:30 AM - 8:00 PM</p>
                <p className="text-gray-500 mt-2">Perfect for early birds and after-work sessions</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Saturday</h3>
                <p className="text-2xl font-bold text-purple-600">6:30 AM - 6:00 PM</p>
                <p className="text-gray-500 mt-2">Weekend warrior sessions</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                  <Clock className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Sunday</h3>
                <p className="text-2xl font-bold text-gray-600">Closed</p>
                <p className="text-gray-500 mt-2">Rest and recovery day</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-xl mb-12 opacity-90">
            One membership plan with everything you need to achieve your fitness goals.
          </p>

          <div className="max-w-md mx-auto">
            <Card className="bg-white text-gray-900 border-0 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <Badge className="bg-yellow-400 text-yellow-900 mx-auto mb-4 px-4 py-2">Most Popular</Badge>
                <CardTitle className="text-3xl">Monthly Membership</CardTitle>
                <div className="text-5xl font-bold text-blue-600 my-4">
                  R120<span className="text-lg text-gray-500">/month</span>
                </div>
                <p className="text-lg text-orange-600 font-semibold">+ R50 joining fee (one-time)</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Full gym access during operating hours</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>All equipment and facilities</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Personal guidance from Sam</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Supportive fitness community</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Friendly neighborhood atmosphere</span>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-lg py-3" onClick={handleMembership}>
                  Join Sam24Fit Today
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Transform Your Life?</h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join our family of 120+ members who have already started their fitness journey with Sam24Fit. Your
            transformation begins with a single step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-12 py-4" onClick={handleGetStarted}>
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-12 py-4 border-gray-300 bg-transparent"
              onClick={handleContact}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp Sam
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Sam24Fit</h3>
                  <p className="text-sm text-gray-400">Pretoria Fitness</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Your neighborhood fitness family in Pretoria, where everyone knows your name and supports your goals.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Operating Hours</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Mon - Fri: 5:30 AM - 8:00 PM</li>
                <li>Saturday: 6:30 AM - 6:00 PM</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="/auth" className="hover:text-white transition-colors">
                    Membership
                  </a>
                </li>
                <li>
                  <a href="/gallery" className="hover:text-white transition-colors">
                    Facilities
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/27679934104"
                    target="_blank"
                    className="hover:text-white transition-colors"
                    rel="noreferrer"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>438 De Kock St, Sunnyside, Pretoria, 0002</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>+27 67 993 4104</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>info@sam24fit.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Sam24Fit. All rights reserved. Built for fitness enthusiasts in Pretoria.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
