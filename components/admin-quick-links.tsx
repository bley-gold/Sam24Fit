"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users2,
  BarChart,
  CircleDollarSign,
  UserMinus,
  FileText,
  MessageSquare,
  UserIcon,
  ChevronRight,
  Navigation,
  Menu,
  X,
} from "lucide-react"

interface QuickLink {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
}

const quickLinks: QuickLink[] = [
  {
    id: "admin-profile",
    label: "Admin Profile",
    icon: UserIcon,
    description: "Your admin details",
    color: "text-blue-600 hover:bg-blue-50",
  },
  {
    id: "statistics",
    label: "Statistics",
    icon: BarChart,
    description: "Key metrics overview",
    color: "text-purple-600 hover:bg-purple-50",
  },
  {
    id: "revenue-chart",
    label: "Revenue Chart",
    icon: BarChart,
    description: "Monthly revenue trends",
    color: "text-orange-600 hover:bg-orange-50",
  },
  {
    id: "membership-status",
    label: "Membership Status",
    icon: CircleDollarSign,
    description: "Paid vs unpaid members",
    color: "text-green-600 hover:bg-green-50",
  },
  {
    id: "deactivation",
    label: "Deactivation",
    icon: UserMinus,
    description: "Members to deactivate",
    color: "text-red-600 hover:bg-red-50",
  },
  {
    id: "user-management",
    label: "User Management",
    icon: Users2,
    description: "All registered members",
    color: "text-indigo-600 hover:bg-indigo-50",
  },
  {
    id: "receipt-management",
    label: "Receipt Management",
    icon: FileText,
    description: "Payment receipts by month",
    color: "text-yellow-600 hover:bg-yellow-50",
  },
  {
    id: "review-management",
    label: "Review Management",
    icon: MessageSquare,
    description: "User reviews & feedback",
    color: "text-pink-600 hover:bg-pink-50",
  },
]

export function AdminQuickLinks() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
    if (isScrolled) {
      setIsExpanded(false)
    }
  }

  if (!isScrolled) {
    return (
      <div className="w-full bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center text-lg">
              <Navigation className="h-5 w-5 mr-2 text-orange-600" />
              Quick Navigation
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {quickLinks.map((link) => {
              const IconComponent = link.icon
              return (
                <Button
                  key={link.id}
                  variant="ghost"
                  className={`${link.color} transition-all duration-200 hover:scale-105 flex flex-col items-center p-4 h-auto bg-white/80 hover:bg-white border border-orange-100 hover:border-orange-300 shadow-sm hover:shadow-md`}
                  onClick={() => scrollToSection(link.id)}
                >
                  <IconComponent className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium text-center leading-tight">{link.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-1/2 right-6 -translate-y-1/2 z-40">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2 bg-orange-600 hover:bg-orange-700 text-white shadow-lg rounded-full p-3"
        size="sm"
      >
        {isExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isExpanded && (
        <Card className="w-80 shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-in slide-in-from-right duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-center mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Navigation className="h-4 w-4 mr-2 text-orange-600" />
                Quick Navigation
              </h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {quickLinks.map((link) => {
                const IconComponent = link.icon
                return (
                  <Button
                    key={link.id}
                    variant="ghost"
                    className={`w-full justify-start h-auto p-3 ${link.color} transition-all duration-200 hover:scale-105`}
                    onClick={() => scrollToSection(link.id)}
                  >
                    <div className="flex items-center w-full">
                      <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{link.label}</div>
                        <div className="text-xs opacity-70">{link.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" />
                    </div>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
