"use client"

/**
 * Create Ride Page - Phase 3.3.3
 * 
 * Page for creating new rides within a club.
 * Supports draft creation and immediate publishing for leadership.
 */

import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { RideForm } from '@/components/rides/ride-form'
import { useClub, useMyClubs } from '@/hooks/use-clubs'
import { useCreateRide } from '@/hooks/use-rides'
import { useAuth } from '@/contexts/auth-context'
import { CreateRideRequest } from '@/lib/types/rides'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CreateRidePage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.clubId as string
  const { user } = useAuth()

  const { data: club, isLoading: clubLoading, error: clubError } = useClub(clubId)
  const { data: myClubs, isLoading: myClubsLoading } = useMyClubs()
  const createRide = useCreateRide()

  // Find user's membership in this club
  const membership = myClubs?.find(c => c.clubId === clubId)
  const isActiveMember = membership?.membershipStatus === 'active'
  
  // Check if user can publish rides (leadership roles)
  const canPublish = isActiveMember && 
    ['owner', 'admin', 'ride_captain', 'ride_leader'].includes(membership?.membershipRole || '')

  const handleSubmit = async (data: CreateRideRequest) => {
    try {
      const result = await createRide.mutateAsync({ clubId, data })
      // Navigate to ride detail page
      if (result?.ride?.rideId) {
        router.push(`/clubs/${clubId}/rides/${result.ride.rideId}`)
      }
    } catch (error) {
      console.error('Failed to create ride:', error)
      // Error toast handled by mutation hook
    }
  }

  const handleCancel = () => {
    router.push(`/clubs/${clubId}`)
  }

  // Loading state
  if (clubLoading || myClubsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  // Error state
  if (clubError || !club) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load club information. Please try again.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    )
  }

  // Check if user is signed in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must be signed in to create rides.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    )
  }

  // Check if user is an active member
  if (!isActiveMember) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must be an active member of this club to create rides.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Create Ride</h1>
            <p className="text-muted-foreground mt-2">
              {club.name}
            </p>
            {!canPublish && (
              <p className="text-sm text-muted-foreground mt-2">
                Your ride will be saved as a draft. Club leadership can publish it to make it visible to all members.
              </p>
            )}
          </div>

          <RideForm
            clubId={clubId}
            canPublish={canPublish}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createRide.isPending}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
