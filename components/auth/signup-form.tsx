"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Users, MapPin, Coffee, Calendar, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SignupFormProps {
  onToggleMode: () => void
  onClose: () => void
}

export function SignupForm({ onToggleMode, onClose }: SignupFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { signup, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await signup(name, email, password)
      if (result.success) {
        if (result.needsVerification) {
          // Redirect to email verification page
          onClose()
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
        } else {
          // User is already verified, go to hub
          onClose()
          router.push("/hub")
        }
      } else {
        // Show error message to user
        console.error("Signup failed:", result.error)
        // You can add a state for error display here
      }
    } catch (error) {
      console.error("Signup failed:", error)
    }
  }

  return (
    <TooltipProvider>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join Collective Rides</CardTitle>
          <CardDescription className="text-base">
            Connect with Sydney's cycling community and discover your next adventure
          </CardDescription>

          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">What you'll get:</p>
            <div className="grid grid-cols-2 gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 p-2 cursor-help hover:bg-orange-100 transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">Local Routes</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Discover curated cycling routes in your area with detailed maps and difficulty ratings</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 p-2 cursor-help hover:bg-orange-100 transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    <span className="text-xs">Find Riders</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connect with cyclists who match your pace and interests for group rides</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 p-2 cursor-help hover:bg-orange-100 transition-colors"
                  >
                    <Coffee className="w-3 h-3" />
                    <span className="text-xs">Coffee Stops</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Access our guide to bike-friendly cafés with secure parking and cyclist amenities</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 p-2 cursor-help hover:bg-orange-100 transition-colors"
                  >
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs">Create Rides</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Organize your own rides and invite others to join your cycling adventures</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                Full Name
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This will be displayed to other cyclists when you join rides</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                Password
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose a strong password with at least 8 characters</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-2.5"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating Your Account..." : "Start Your Cycling Journey"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already part of the community?{" "}
              <button
                onClick={onToggleMode}
                className="text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
