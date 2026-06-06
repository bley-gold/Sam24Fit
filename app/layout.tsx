import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sam24Fit | Community Gym in Sunnyside Pretoria",
  description:
    "Join Sam24Fit, a community-focused gym in Sunnyside Pretoria offering affordable memberships, fitness coaching, strength training and transformation support.",
  metadataBase: new URL("https://sam24fit.co.za"),
  alternates: {
    canonical: "https://sam24fit.co.za",
  },
  openGraph: {
    title: "Sam24Fit | Premium Community Gym in Pretoria",
    description:
      "Join Sam24Fit, a community-focused gym in Sunnyside Pretoria offering affordable memberships, fitness coaching, strength training and transformation support.",
    url: "https://sam24fit.co.za",
    siteName: "Sam24Fit",
    images: [
      {
        url: "/modern-gym.png",
        width: 1016,
        height: 405,
        alt: "Sam24Fit Community Gym",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sam24Fit | Community Gym in Sunnyside Pretoria",
    description:
      "Join Sam24Fit, a community-focused gym in Sunnyside Pretoria offering affordable memberships, fitness coaching, strength training and transformation support.",
    images: ["/modern-gym.png"],
  },
  icons: {
    icon: [
      {
        url: "/icon.jpg",
        type: "image/jpeg",
      },
    ],
    apple: [
      {
        url: "/icon.jpg",
        sizes: "180x180",
        type: "image/jpeg",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Sam24Fit",
              description: "Community-focused gym in Sunnyside Pretoria",
              url: "https://sam24fit.co.za",
              telephone: "+27679934104",
              email: "contact@sam24fit.co.za",
              address: {
                "@type": "PostalAddress",
                streetAddress: "438 De Kock Street",
                addressLocality: "Sunnyside",
                addressRegion: "Pretoria",
                postalCode: "0002",
                addressCountry: "ZA",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "-25.7461",
                longitude: "28.2309",
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "05:30",
                  closes: "20:00",
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: "Saturday",
                  opens: "06:30",
                  closes: "18:00",
                },
              ],
              priceRange: "R120",
              image: "https://sam24fit.co.za/modern-gym.png",
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
