"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new profile page
    router.replace("/profile")
  }, [router])

  return null
}
