"use client"

import { useParams, useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, AlertCircle, ArrowLeft, Save } from "lucide-react"
import { useClub, useUpdateClub } from "@/hooks/use-clubs"
import { useAuth } from "@/contexts/auth-context"
import { UpdateClubRequest } from "@/lib/types/clubs"

export default function ClubSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.clubId as string
  const { user } = useAuth()

  const { data: club, isLoading: clubLoading } = useClub(clubId)
  const updateClub = useUpdateClub()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [membershipApprovalType, setMembershipApprovalType] = useState<'open' | 'request_to_join'>('open')

  // Initialize form when club data loads
  useState(() => {
    if (club) {
      setName(club.name || '')
      setDescription(club.description || '')
      setCity(club.city || '')
      setLogoUrl(club.logoUrl || '')
      setMembershipApprovalType(club.membershipApprovalType || 'open')
    }
  })

  // Authorization check
  const canManageSettings = useMemo(() => {
    if (!club?.userMembership) return false
    return ['owner', 'admin'].includes(club.userMembership.role)
  }, [club?.userMembership])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data: UpdateClubRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      city: city.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      membershipApprovalType,
    }

    try {
      await updateClub.mutateAsync({ clubId, data })
      // Stay on page to allow further edits
    } catch (error) {
      console.error('Failed to update club:', error)
    }
  }

  // Loading state
  if (clubLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading club settings...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Authorization check
  if (!canManageSettings) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground text-center mb-6">
                You don't have permission to manage club settings.
              </p>
              <Link href={`/clubs/${clubId}`}>
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Club
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Club Settings</h1>
              <p className="text-muted-foreground mt-1">{club?.name}</p>
            </div>
            <Link href={`/clubs/${clubId}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Club
              </Button>
            </Link>
          </div>

          {/* Settings Form */}
          <Card>
            <CardHeader>
              <CardTitle>Club Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Club Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Club Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter club name"
                    required
                    maxLength={100}
                  />
                  <p className="text-sm text-muted-foreground">
                    {name.length}/100 characters
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your club..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-muted-foreground">
                    {description.length}/500 characters
                  </p>
                </div>

                {/* City/Area */}
                <div className="space-y-2">
                  <Label htmlFor="city">City/Area</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Sydney, Melbourne"
                    maxLength={50}
                  />
                </div>

                {/* Logo URL */}
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a URL to your club's logo image
                  </p>
                </div>

                {/* Membership Approval Mode */}
                <div className="space-y-3">
                  <Label>Membership Approval</Label>
                  <RadioGroup
                    value={membershipApprovalType}
                    onValueChange={(value) => setMembershipApprovalType(value as 'open' | 'request_to_join')}
                  >
                    <div className="flex items-start space-x-3 space-y-0">
                      <RadioGroupItem value="open" id="open" />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="open" className="font-medium cursor-pointer">
                          Open Join
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Anyone can join immediately without approval
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0">
                      <RadioGroupItem value="request_to_join" id="request_to_join" />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="request_to_join" className="font-medium cursor-pointer">
                          Request to Join
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          New members must request to join and be approved by admins
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/clubs/${clubId}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateClub.isPending || !name.trim()}
                  >
                    {updateClub.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
