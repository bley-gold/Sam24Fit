"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { getUserRoleFromJWT } from "@/lib/auth"

export function JWTDebugger() {
  const [jwtInfo, setJwtInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const debugJWT = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setJwtInfo({ error: "No active session" })
        return
      }

      // Decode JWT payload
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))
      const roleFromJWT = await getUserRoleFromJWT()

      setJwtInfo({
        user_id: payload.sub,
        email: payload.email,
        user_role: payload.user_role,
        app_metadata: payload.app_metadata,
        roleFromHelper: roleFromJWT,
        expires_at: new Date(payload.exp * 1000).toLocaleString(),
        full_payload: payload
      })
    } catch (error) {
      setJwtInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>JWT Debug Info</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={debugJWT} disabled={loading}>
          {loading ? "Loading..." : "Debug JWT Claims"}
        </Button>
        
        {jwtInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(jwtInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
