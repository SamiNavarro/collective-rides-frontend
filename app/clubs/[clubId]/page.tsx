"use client"

import { useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Users, MapPin, Calendar, Loader2, AlertCircle, UserPlus, LogOut, Plus, Clock, ArrowRight } from "lucide-react"
import { useClub, useJoinClub, useLeaveClub, useClubRides } from "@/hooks/use-clubs"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from 'next/navigation'

export default function ClubDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.clubId as string
  const { user } = useAuth()

  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  const { data: club, isLoading, error } = useClub(clubId)
  const { data: rides, isLoading: ridesLoading } = useClubRides(clubId, {
    enabled: !!club?.userMembership && club.userMembership.status === 'active'
  })
  const joinClub = useJoinClub()
  const leaveClub = useLeaveClub()

  // Debug logging
  if (club) {
    console.log('🔍 Club data received:', JSON.stringify(club, null, 2))
    console.log('  - club.id:', club.id)
    console.log('  - club.name:', club.name)
    console.log('  - club.description:', club.description)
    console.log('  - club.status:', club.status)
    console.log('  - club.memberCount:', club.memberCount)
    console.log('  - club.city:', club.city)
    console.log('  - All keys:', Object.keys(club))
  }

  const isActiveMember = club?.userMembership?.status === 'active'
  const canCreateRides = isActiveMember && ['ride_leader', 'ride_captain', 'admin', 'owner'].includes(club?.userMembership?.role || '')

  const handleJoinClub = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      await joinClub.mutateAsync({
        clubId,
        data: {} // Empty data for instant activation
      })
    } catch (error) {
      console.error('Failed to join club:', error)
    }
  }

  const handleLeaveClub = async () => {
    try {
      await leaveClub.mutateAsync(clubId)
      setShowLeaveDialog(false)
    } catch (error) {
      console.error('Failed to leave club:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading club details...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Unable to Load Club</h2>
              <p className="text-muted-foreground text-center mb-6">
                {error instanceof Error ? error.message : 'This club no longer exists or you do not have permission to view it.'}
              </p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Club Content */}
        {club && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Club Header - Public Section */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3">
                      {club.name || clubId || 'Unknown Club'}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                      {club.city && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{club.city}</span>
                        </div>
                      )}
                      {club.memberCount !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">
                            {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      )}
                      {club.createdAt && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            Est. {new Date(club.createdAt).getFullYear()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Membership Status Badge */}
                  {club.userMembership && (
                    <div className="flex flex-col items-end gap-2">
                      {club.userMembership.status === 'active' && (
                        <>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Active Member
                          </Badge>
                          {club.userMembership.role !== 'member' && (
                            <Badge variant="outline" className="text-xs">
                              {club.userMembership.role.charAt(0).toUpperCase() + club.userMembership.role.slice(1)}
                            </Badge>
                          )}
                        </>
                      )}
                      {club.userMembership.status === 'pending' && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Application Pending
                        </Badge>
                      )}
                      {club.userMembership.status === 'suspended' && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          Suspended
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              {/* Club Description */}
              {club.description ? (
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground leading-relaxed">{club.description}</p>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <p className="text-muted-foreground text-sm italic">
                      This club hasn't added a description yet.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Membership Actions */}
            <Card>
              <CardContent className="py-6">
                <div className="flex justify-center">
                  {!club.userMembership && (
                    <Button 
                      size="lg"
                      onClick={handleJoinClub}
                      disabled={joinClub.isPending}
                      className="min-w-[200px]"
                    >
                      {joinClub.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Join Club
                        </>
                      )}
                    </Button>
                  )}
                  {club.userMembership?.status === 'active' && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => setShowLeaveDialog(true)}
                      disabled={leaveClub.isPending}
                      className="min-w-[200px]"
                    >
                      {leaveClub.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Leaving...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Leave Club
                        </>
                      )}
                    </Button>
                  )}
                  {club.userMembership?.status === 'pending' && (
                    <Button size="lg" disabled className="min-w-[200px]">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Application Pending
                    </Button>
                  )}
                  {club.userMembership?.status === 'suspended' && (
                    <Button size="lg" disabled variant="destructive" className="min-w-[200px]">
                      Membership Suspended
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leave Club Confirmation Dialog */}
            <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave {club.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave this club? You will lose access to club rides and member content.
                    You can rejoin at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLeaveClub}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Leave Club
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Member-Only Content - Upcoming Rides */}
            {isActiveMember && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Upcoming Rides</CardTitle>
                  {canCreateRides && (
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ride
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {ridesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : rides && rides.length > 0 ? (
                    <div className="space-y-3">
                      {rides.map((ride: any) => (
                        <Link
                          key={ride.id}
                          href={`/rides/${ride.id}`}
                          className="block"
                        >
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-lg mb-2 truncate">
                                    {ride.title}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>
                                        {new Date(ride.startTime).toLocaleDateString('en-AU', {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {new Date(ride.startTime).toLocaleTimeString('en-AU', {
                                          hour: 'numeric',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    {ride.participantCount !== undefined && (
                                      <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <span>{ride.participantCount} going</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Upcoming Rides</h3>
                      <p className="text-muted-foreground mb-6">
                        {canCreateRides
                          ? "Be the first to organize a ride for this club!"
                          : "Check back soon for new rides from your club."}
                      </p>
                      {canCreateRides && (
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Ride
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
