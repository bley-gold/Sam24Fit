"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthContext } from "@/components/auth-provider"
import { signOut } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Dumbbell, LogOut, Shield } from "lucide-react"

export function AdminHeader() {
  const { user } = useAuthContext()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await signOut()
      toast({ title: "Logged out", description: "You have been successfully logged out." })
      router.push("/")
    } catch (error) {
      toast({ title: "Error", description: "Failed to log out.", variant: "destructive" })
      console.error("Logout error:", error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">Sam24Fit Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-red-100 text-red-800">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
            <span className="text-sm text-gray-600">Welcome, {user?.full_name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
