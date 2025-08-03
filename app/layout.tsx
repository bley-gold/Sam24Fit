import type React from "react"
import type { Metadata } from "next"
import type { Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sam24Fit - Premium Gym in Pretoria",
  description:
    "Join Sam24Fit, Pretoria's premier fitness destination. Modern equipment, flexible hours, and a supportive community to help you achieve your fitness goals.",
  keywords: "gym, fitness, Pretoria, South Africa, workout, membership, Sam24Fit",
  authors: [{ name: "Sam24Fit" }],
  creator: "Sam24Fit",
  publisher: "Sam24Fit",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://sam24fit.netlify.app",
    title: "Sam24Fit - Premium Gym in Pretoria",
    description: "Join Sam24Fit, Pretoria's premier fitness destination.",
    siteName: "Sam24Fit",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sam24Fit - Premium Gym in Pretoria",
    description: "Join Sam24Fit, Pretoria's premier fitness destination.",
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
