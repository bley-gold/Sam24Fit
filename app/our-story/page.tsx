"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Dumbbell, Users, Trophy, Heart, Target } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

export default function OurStoryPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const slides = [
    {
      id: 1,
      title: "From a Garage Dream",
      year: "2018",
      content:
        "Sam started with nothing but a passion for fitness and a small garage in Sunnyside. With just a few dumbbells and a bench, he began training neighbors and friends. What started as helping a few people stay fit became the foundation of our tight-knit community.",
      image: "/placeholder-j7c7t.png",
      milestone: "Community roots",
      stats: "5 neighbors",
    },
    {
      id: 2,
      title: "Our First Home",
      year: "2019",
      content:
        "Word spread through the neighborhood, and we outgrew the garage. Sam found a small 150 square meter space on De Kock Street. It wasn't fancy, but it was ours. Local residents started joining, creating friendships that last to this day.",
      image: "/small-basic-gym.png",
      milestone: "Local community space",
      stats: "20 local members",
    },
    {
      id: 3,
      title: "Staying Strong Together",
      year: "2020",
      content:
        "When the world shut down, our small gym family proved its strength. We supported each other through tough times, adapted our space for safety, and showed that a local community gym isn't just about equipment - it's about people caring for people.",
      image: "/socially-distanced-gym.png",
      milestone: "Community resilience",
      stats: "40 loyal members",
    },
    {
      id: 4,
      title: "Growing with Our Community",
      year: "2021",
      content:
        "As Sunnyside grew, so did we. We expanded our space and added better equipment, but kept our community feel. Every new member was welcomed personally by Sam, and our 'gym family' tradition of celebrating each other's achievements continued to flourish.",
      image: "/modern-gym.png",
      milestone: "Neighborhood expansion",
      stats: "70 community members",
    },
    {
      id: 5,
      title: "Making Life Easier",
      year: "2022",
      content:
        "We introduced our simple online system to make payments and membership easier for our busy community members. No complicated apps or corporate systems - just a straightforward way for our local members to manage their fitness journey with us.",
      image: "/modern-gym-tech.png",
      milestone: "Simple digital solutions",
      stats: "90+ happy members",
    },
    {
      id: 6,
      title: "Your Local Fitness Family",
      year: "2024",
      content:
        "Today, Sam24Fit is home to 120+ members from Sunnyside and surrounding areas. We're not a corporate chain - we're your local gym where everyone knows your name, celebrates your progress, and supports your journey. This is where neighbors become family.",
      image: "/placeholder-jmyhf.png",
      milestone: "Local fitness family",
      stats: "120+ neighbors",
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevSlide()
      } else if (e.key === "ArrowRight") {
        nextSlide()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  const handleBackHome = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={handleBackHome} className="text-gray-600 hover:text-blue-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Dumbbell className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sam24Fit</h1>
                <p className="text-xs text-gray-500">Our Story</p>
              </div>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Story Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium mb-4">
              🏠 From Garage to Community Hub
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Our Journey</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover how Sam24Fit grew from a neighborhood garage gym to Sunnyside's beloved community fitness family
            </p>
          </div>

          {/* Horizontal Scrolling Container */}
          <div className="relative">
            {/* Navigation Arrows */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg"
              onClick={prevSlide}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg"
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Slides Container */}
            <div
              className="overflow-hidden rounded-2xl"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slides.map((slide, index) => (
                  <div key={slide.id} className="w-full flex-shrink-0">
                    <Card className="mx-4 bg-white shadow-xl border-0">
                      <CardContent className="p-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[500px]">
                          {/* Image Section */}
                          <div className="relative overflow-hidden lg:order-1">
                            <Image
                              src={slide.image || "/placeholder.svg"}
                              alt={slide.title}
                              width={600}
                              height={400}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4">
                              <Badge className="bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
                                {slide.year}
                              </Badge>
                            </div>
                            <div className="absolute bottom-4 right-4">
                              <Badge className="bg-white/90 text-gray-900 px-3 py-1 text-sm font-semibold">
                                {slide.stats}
                              </Badge>
                            </div>
                          </div>

                          {/* Content Section */}
                          <div className="p-8 lg:p-12 flex flex-col justify-center lg:order-2">
                            <div className="space-y-6">
                              <div>
                                <Badge className="bg-purple-100 text-purple-800 px-3 py-1 text-sm font-medium mb-4">
                                  {slide.milestone}
                                </Badge>
                                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{slide.title}</h2>
                              </div>

                              <p className="text-lg text-gray-600 leading-relaxed">{slide.content}</p>

                              {/* Progress Indicator */}
                              <div className="flex items-center space-x-2 pt-4">
                                <span className="text-sm text-gray-500">
                                  {index + 1} of {slides.length}
                                </span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${((index + 1) / slides.length) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide ? "bg-blue-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white border-0 shadow-lg text-center">
              <CardContent className="p-6">
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">6</div>
                <div className="text-sm text-gray-500">Years Strong</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg text-center">
              <CardContent className="p-6">
                <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600">120+</div>
                <div className="text-sm text-gray-500">Community Members</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg text-center">
              <CardContent className="p-6">
                <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">500+</div>
                <div className="text-sm text-gray-500">Goals Achieved</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg text-center">
              <CardContent className="p-6">
                <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">∞</div>
                <div className="text-sm text-gray-500">Neighborhood Love</div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0 shadow-xl max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Join Our Fitness Family</h3>
                <p className="text-lg opacity-90 mb-6">
                  Become part of Sunnyside's most welcoming fitness community. Where neighbors support neighbors and
                  everyone celebrates your success.
                </p>
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8"
                  onClick={() => (window.location.href = "/auth")}
                >
                  Join Sam24Fit Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
