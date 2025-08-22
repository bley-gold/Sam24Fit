"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, Loader2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { uploadProfilePicture, validateProfilePicture, deleteProfilePicture } from "@/lib/storage"
import { updateUserProfilePicture } from "@/app/actions/profile-actions"
import type { User } from "@/lib/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"

interface ProfilePictureUploadProps {
  user: User
  onProfileUpdate: () => Promise<void> | void
  isAdmin?: boolean
}

export function ProfilePictureUpload({ user, onProfileUpdate, isAdmin = false }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [optimisticProfileUrl, setOptimisticProfileUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const currentProfileUrl = optimisticProfileUrl || user.profile_picture_url

  const handleProfilePictureClick = () => {
    if (currentProfileUrl) {
      setShowProfileModal(true)
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateProfilePicture(file)
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    const filePreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(filePreviewUrl)

    setSelectedFile(file)
    setShowConfirmDialog(true)
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewUrl) return

    setIsUploading(true)
    setShowConfirmDialog(false)
    setShowProfileModal(false)

    setOptimisticProfileUrl(previewUrl)

    try {
      // Delete old profile picture if it exists
      if (user.profile_picture_url) {
        const urlParts = user.profile_picture_url.split("/")
        const bucketIndex = urlParts.findIndex((part) => part === "profile-pictures")
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          const filePath = urlParts.slice(bucketIndex + 1).join("/")
          await deleteProfilePicture(filePath)
        }
      }

      // Upload new profile picture
      const uploadResult = await uploadProfilePicture(selectedFile, user.id)

      if (uploadResult.error) {
        throw uploadResult.error
      }

      if (!uploadResult.publicUrl) {
        throw new Error("Failed to get public URL for uploaded file")
      }

      // Add cache-busting param so browser always fetches new image
      const freshUrl = `${uploadResult.publicUrl}?t=${Date.now()}`

      // Update user profile with new picture URL
      const updateResult = await updateUserProfilePicture(user.id, freshUrl)

      if (!updateResult.success) {
        throw new Error(updateResult.message)
      }

      setOptimisticProfileUrl(freshUrl)

      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      })

      // Make sure parent re-fetches user data if provided
      if (onProfileUpdate) {
        try {
          await onProfileUpdate()
        } catch (err) {
          console.warn("Profile refresh failed:", err)
        }
      }
    } catch (error) {
      console.error("Profile picture upload error:", error)
      setOptimisticProfileUrl(null)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCancelUpload = () => {
    setShowConfirmDialog(false)
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <div className="absolute -bottom-2 -right-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          size="sm"
          onClick={handleProfilePictureClick}
          disabled={isUploading}
          className="rounded-full h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600 shadow-lg"
          title={isAdmin ? "View/Update admin profile picture" : "View/Update profile picture"}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : currentProfileUrl ? (
            <Eye className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Profile Picture Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Profile Picture: {user.full_name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            {currentProfileUrl && (
              <Image
                src={currentProfileUrl || "/placeholder.svg"}
                alt={`${user.full_name}'s profile picture`}
                width={300}
                height={300}
                className="rounded-full object-cover border-4 border-orange-500 shadow-lg"
              />
            )}
            <div className="flex space-x-2">
              <Button onClick={handleUploadClick} disabled={isUploading}>
                <Camera className="h-4 w-4 mr-2" />
                {currentProfileUrl ? "Update Picture" : "Upload Picture"}
              </Button>
              <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update your profile picture? This will replace your current profile picture.
              {selectedFile && (
                <div className="mt-4 flex flex-col items-center space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>Selected file:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                    MB)
                  </div>
                  {previewUrl && (
                    <Image
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview"
                      width={120}
                      height={120}
                      className="rounded-full object-cover border-2 border-orange-500"
                    />
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUpload}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpload} className="bg-orange-500 hover:bg-orange-600">
              Update Picture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
