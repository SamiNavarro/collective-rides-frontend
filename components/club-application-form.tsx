"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { X, Send, Clock, CheckCircle } from "lucide-react"

interface ClubApplicationFormProps {
  clubId: string
  clubName: string
  onClose: () => void
}

export function ClubApplicationForm({ clubId, clubName, onClose }: ClubApplicationFormProps) {
  const { applyToClub, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    experience: "",
    motivation: "",
    availability: [] as string[],
    message: "",
  })

  const availabilityOptions = [
    "Saturday Morning",
    "Saturday Afternoon",
    "Sunday Morning",
    "Sunday Afternoon",
    "Weekday Evenings",
    "Weekday Mornings",
  ]

  const handleAvailabilityChange = (option: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        availability: [...prev.availability, option],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        availability: prev.availability.filter((item) => item !== option),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)

    try {
      await applyToClub({
        clubId,
        clubName,
        experience: formData.experience,
        motivation: formData.motivation,
        availability: formData.availability,
        message: formData.message,
      })

      setIsSubmitted(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Failed to submit application:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Application Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Your application to join {clubName} has been submitted successfully. You'll receive a notification once
              the club administrators review your application.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Typical response time: 2-3 days</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Apply to Join {clubName}</CardTitle>
            <CardDescription>Tell us about yourself and why you'd like to join this club</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="experience">Cycling Experience Level</Label>
              <Input
                id="experience"
                placeholder="e.g., Beginner, Intermediate, Advanced"
                value={formData.experience}
                onChange={(e) => setFormData((prev) => ({ ...prev, experience: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="motivation">Why do you want to join this club?</Label>
              <Textarea
                id="motivation"
                placeholder="Share your motivation for joining and what you hope to gain from the experience..."
                value={formData.motivation}
                onChange={(e) => setFormData((prev) => ({ ...prev, motivation: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <div>
              <Label>When are you typically available for rides?</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {availabilityOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={formData.availability.includes(option)}
                      onCheckedChange={(checked) => handleAvailabilityChange(option, checked as boolean)}
                    />
                    <Label htmlFor={option} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="message">Additional Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Any additional information you'd like to share with the club..."
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your application will be reviewed by club administrators</li>
                <li>• You'll receive a notification with their decision</li>
                <li>• If approved, the club will be added to your "My Clubs" section</li>
                <li>• You'll gain access to club rides, events, and community features</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.experience || !formData.motivation}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
