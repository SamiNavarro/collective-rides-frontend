"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SiteAdminDashboard } from "@/components/dashboards/site-admin-dashboard"

export default function SiteAdminPage() {
  const { user, isSiteAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    if (!isSiteAdmin()) {
      router.push("/hub")
      return
    }
  }, [user, isSiteAdmin, router])

  if (!user || !isSiteAdmin()) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this area</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <SiteAdminDashboard />
      </div>
      <Footer />
    </div>
  )
}
