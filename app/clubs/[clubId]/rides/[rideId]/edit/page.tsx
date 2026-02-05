"use client"

/**
 * Edit Ride Page - Phase 3.3.4
 * 
 * Allows ride creators and club leadership to edit ride details before start time.
 */

import { useParams, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RideForm } from "@/components/rides/ride-form"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { useRide, useUpdateRide } from "@/hooks/use-rides"
import { useMyClubs } from "@/hooks/use-clubs"
import { useAuth } from "@/contexts/auth-context"
import { UpdateRideRequest, RideStatus } from "@/lib/types/rides"
import { Button } from "@/components/ui/button"

export default function EditRidePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const clubId = params.clubId as string
  const rideId = params.rideId as string

  const { data: ride, isLoading: rideLoading, error: rideError } = useRide(clubId, rideId)
  const { data: myClubs, isLoading: clubsLoading } = useMyClubs()
  const updateRide = useUpdateRide()

  // Find user's membership in this club
  const membership = useMemo(() => {
    if (!myClubs) return null
    return myClubs.find(c => c.clubId === clubId)
  }, [myClubs, clubId])

  // Check if user can edit this ride
  const canEdit = useMemo(() => {
    if (!ride || !membership || !user) return false
    
    // Cannot edit after start time
    if (new Date(ride.startDateTime) <= new Date()) return false
    
    // Cannot edit completed, cancelled, or active rides
    if ([RideStatus.COMPLETED, RideStatus.CANCELLED, RideStatus.ACTIVE].includes(ride.status)) return false
    
    // Ride creator can edit
    if (ride.createdBy === user.id) return true
    
    // Leadership can edit
    const leadershipRoles = ['owner', 'admin', 'ride_captain', 'ride_leader']
    return leadershipRoles.includes(membership.membershipRole)
  }, [ride, membership, user])

  const handleSubmit = async (data: UpdateRideRequest) => {
    await updateRide.mutateAsync({ clubId, rideId, data })
    router.push(`/clubs/${clubId}/rides/${rideId}`)
  }

  const handleCancel = () => {
    router.back()
  }

  // Loading state
  if (rideLoading || clubsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading ride details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Error state
  if (rideError || !ride) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Unable to Load Ride</h2>
              <p className="text-muted-foreground text-center mb-6">
                {rideError instanceof Error ? rideError.message : 'This ride no longer exists or you do not have permission to view it.'}
              </p>
              <Button onClick={() => router.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  // Permission check
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Cannot Edit Ride</h2>
              <p className="text-muted-foreground text-center mb-6">
                {new Date(ride.startDateTime) <= new Date()
                  ? 'Cannot edit ride after start time.'
                  : ['completed', 'cancelled', 'active'].includes(ride.status)
                  ? `Cannot edit ${ride.status} rides.`
                  : 'You do not have permission to edit this ride.'}
              </p>
              <Button onClick={() => router.push(`/clubs/${clubId}/rides/${rideId}`)}>
                View Ride
              </Button>
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
          <h1 className="text-3xl font-bold mb-6">Edit Ride</h1>
          
          <RideForm
            clubId={clubId}
            canPublish={false} // Cannot change publish status when editing
            onSubmit={handleSubmit as any}
            onCancel={handleCancel}
            isSubmitting={updateRide.isPending}
            initialData={ride}
            mode="edit"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
