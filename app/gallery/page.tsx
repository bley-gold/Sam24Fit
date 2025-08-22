"use client"

import { useState } from "react"
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

const galleryImages = [
  {
    id: 1,
    src: "/urban-fitness-graffiti.png",
    alt: "Urban fitness with graffiti art",
    category: "Atmosphere",
  },
  {
    id: 2,
    src: "/modern-gym.png",
    alt: "Modern gym equipment",
    category: "Equipment",
  },
  {
    id: 3,
    src: "/modern-gym-tech.png",
    alt: "High-tech gym equipment",
    category: "Equipment",
  },
  {
    id: 4,
    src: "/small-basic-gym.png",
    alt: "Cozy gym space",
    category: "Facility",
  },
  {
    id: 5,
    src: "/socially-distanced-gym.png",
    alt: "Safe workout environment",
    category: "Facility",
  },
  {
    id: 6,
    src: "/community-workout.png",
    alt: "Community workout session",
    category: "Community",
  },
  {
    id: 7,
    src: "/placeholder-nn2b5.png",
    alt: "Members training together",
    category: "Community",
  },
  {
    id: 8,
    src: "/placeholder-7u0gm.png",
    alt: "Sam helping a member",
    category: "Personal Training",
  },
  {
    id: 9,
    src: "/placeholder-06c5j.png",
    alt: "Early morning session",
    category: "Classes",
  },
  {
    id: 10,
    src: "/placeholder-r8ts8.png",
    alt: "Strength training area",
    category: "Equipment",
  },
  {
    id: 11,
    src: "/placeholder-4p4h9.png",
    alt: "Cardio section",
    category: "Equipment",
  },
  {
    id: 12,
    src: "/placeholder-tx0oa.png",
    alt: "Gym entrance",
    category: "Facility",
  },
]

const categories = ["All", "Equipment", "Facility", "Community", "Classes", "Personal Training", "Atmosphere"]

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const filteredImages =
    selectedCategory === "All" ? galleryImages : galleryImages.filter((img) => img.category === selectedCategory)

  const openLightbox = (imageId: number) => {
    setSelectedImage(imageId)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return

    const currentIndex = filteredImages.findIndex((img) => img.id === selectedImage)
    let newIndex

    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1
    } else {
      newIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0
    }

    setSelectedImage(filteredImages[newIndex].id)
  }

  const selectedImageData = selectedImage ? galleryImages.find((img) => img.id === selectedImage) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sam24Fit Gallery</h1>
                <p className="text-gray-600 mt-1">See our community in action</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              onClick={() => openLightbox(image.id)}
            >
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-gray-900">{image.alt}</p>
                <p className="text-xs text-gray-500 mt-1">{image.category}</p>
              </div>
            </div>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No images found in this category.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && selectedImageData && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white hover:bg-opacity-20"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation buttons */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => navigateImage("prev")}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => navigateImage("next")}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {/* Image */}
            <div className="relative">
              <Image
                src={selectedImageData.src || "/placeholder.svg"}
                alt={selectedImageData.alt}
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                <h3 className="text-white text-xl font-semibold">{selectedImageData.alt}</h3>
                <p className="text-gray-300 text-sm">{selectedImageData.category}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
