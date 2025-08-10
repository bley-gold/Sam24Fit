"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, Loader2 } from "lucide-react"
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

interface ProfilePictureUploadProps {
  user: User
  onProfileUpdate: () => void
  isAdmin?: boolean
}

export function ProfilePictureUpload({ user, onProfileUpdate, isAdmin = false }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate the file
    const validation = validateProfilePicture(file)
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    // Store the selected file and show confirmation dialog
    setSelectedFile(file)
    setShowConfirmDialog(true)
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setShowConfirmDialog(false)

    try {
      // Delete old profile picture if it exists
      if (user.profile_picture_url) {
        // Extract the file path from the URL
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

      // Update user profile with new picture URL
      const updateResult = await updateUserProfilePicture(user.id, uploadResult.publicUrl)

      if (!updateResult.success) {
        throw new Error(updateResult.message)
      }

      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      })

      // Trigger profile refresh
      onProfileUpdate()
    } catch (error) {
      console.error("Profile picture upload error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setSelectedFile(null)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCancelUpload = () => {
    setShowConfirmDialog(false)
    setSelectedFile(null)
    // Reset file input
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
          onClick={handleUploadClick}
          disabled={isUploading}
          className="rounded-full h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600 shadow-lg"
          title={isAdmin ? "Update admin profile picture" : "Update profile picture"}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : user.profile_picture_url ? (
            <Camera className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update your profile picture? This will replace your current profile picture.
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Selected file:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                  MB)
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
