"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dumbbell,
  Clock,
  Trophy,
  Shield,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Heart,
  Camera,
  Play,
  CheckCircle,
  Star,
} from "lucide-react"
import Image from "next/image"
import { getApprovedReviews } from "@/app/actions/review-actions"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    const fetchReviews = async () => {
      console.log("[v0] Fetching reviews...")
      const { success, data } = await getApprovedReviews()
      console.log("[v0] Review fetch result:", { success, data, dataLength: data?.length })
      if (success) {
        setReviews(data)
        console.log("[v0] Reviews set in state:", data)
      } else {
        console.log("[v0] Failed to fetch reviews")
      }
    }
    fetchReviews()
  }, [])

  const handleGetStarted = () => {
    window.location.href = "/auth"
  }

  const galleryImages = [
    { id: 1, title: "State-of-the-art Equipment", category: "Equipment" },
    { id: 2, title: "Spacious Workout Area", category: "Facility" },
    { id: 3, title: "Cardio Zone", category: "Equipment" },
    { id: 4, title: "Free Weights Section", category: "Equipment" },
    { id: 5, title: "Group Training Area", category: "Classes" },
    { id: 6, title: "Locker Rooms", category: "Facility" },
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
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
                🏆 Pretoria's #1 Fitness Destination
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Fitness
                <span className="text-blue-600 block">Journey Starts</span>
                <span className="text-purple-600">Here</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Join Sam24Fit and discover a world-class fitness experience in the heart of Pretoria. Modern equipment,
                expert guidance, and a supportive community await you.
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
              >
                <Play className="mr-2 h-5 w-5" />
                Virtual Tour
              </Button>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">5000+</div>
                <div className="text-sm text-gray-500">Active Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">R120</div>
                <div className="text-sm text-gray-500">Per Month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">24/6</div>
                <div className="text-sm text-gray-500">Operating Days</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl p-8 text-white">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Premium Membership</h3>
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
                    <span>Locker room facilities</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5" />
                    <span>Community support</span>
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
              We provide everything you need for a successful fitness journey in a modern, welcoming environment.
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
                  Open Monday to Saturday with extended hours to fit your busy schedule. Train when it works for you.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Proven Results</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Our members achieve their goals with our comprehensive approach to fitness and wellness.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Safe Environment</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Clean, sanitized facilities with top-notch safety protocols to keep you healthy and secure.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Take a Look Inside</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our modern facilities and see why Sam24Fit is Pretoria's premier fitness destination.
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
            <Button variant="outline" size="lg" className="px-8 bg-transparent">
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
            {console.log("[v0] Rendering reviews section, reviews count:", reviews.length)}
            {reviews.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500 text-lg">No reviews available yet</p>
              </div>
            )}
            {reviews.slice(0, 8).map((review, index) => {
              const positions = [
                { top: "10%", left: "5%" },
                { top: "20%", right: "10%" },
                { top: "40%", left: "15%" },
                { top: "60%", right: "20%" },
                { top: "15%", left: "50%" },
                { top: "70%", left: "60%" },
                { top: "30%", right: "5%" },
                { top: "80%", left: "25%" },
              ]

              const position = positions[index] || { top: "50%", left: "50%" }

              return (
                <div
                  key={review.id}
                  className="absolute animate-float"
                  style={{
                    ...position,
                    animationDelay: `${index * 0.5}s`,
                    animationDuration: `${4 + (index % 3)}s`,
                  }}
                >
                  <div className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 max-w-xs group hover:scale-105">
                    <div className="flex items-center space-x-3 mb-3">
                      <Image
                        src={
                          review.users?.profile_picture_url || "/placeholder.svg?height=40&width=40&query=user profile"
                        }
                        alt={review.users?.full_name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {review.users?.full_name || "Anonymous"}
                        </p>
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
            })}
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
                    <span>Locker room access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Clean and safe environment</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Supportive fitness community</span>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-lg py-3" onClick={handleGetStarted}>
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
            Join thousands of members who have already started their fitness journey with Sam24Fit. Your transformation
            begins with a single step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-12 py-4" onClick={handleGetStarted}>
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-12 py-4 border-gray-300 bg-transparent">
              Contact Us
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
                Your premier fitness destination in Pretoria, dedicated to helping you achieve your health and wellness
                goals.
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
                  <a href="#" className="hover:text-white transition-colors">
                    Membership
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Facilities
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
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
