"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  MapPin,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { useMyClubs, useLeaveClub } from "@/hooks/use-clubs"

export default function MyClubsPage() {
  const { user } = useAuth()
  const { data: clubs, isLoading, error, refetch } = useMyClubs()
  const leaveClubMutation = useLeaveClub()

  // Handle unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Please sign in to access your clubs</h1>
          <p className="text-muted-foreground mb-6">Sign in to manage your club memberships and activities</p>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Clubs</h1>
            <p className="text-muted-foreground">
              Manage your club memberships and stay connected with your cycling community
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading your clubs...</span>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Clubs</h1>
            <p className="text-muted-foreground">
              Manage your club memberships and stay connected with your cycling community
            </p>
          </div>
          <Card className="text-center py-12">
            <CardContent className="px-6 pb-6 pt-12">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Failed to load clubs</h3>
              <p className="text-muted-foreground mb-6">
                {error instanceof Error ? error.message : 'Something went wrong while loading your clubs'}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  // Handle empty state
  if (!clubs || clubs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Clubs</h1>
            <p className="text-muted-foreground">
              Manage your club memberships and stay connected with your cycling community
            </p>
          </div>
          <Card className="text-center py-12">
            <CardContent className="px-6 pb-6 pt-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No clubs joined yet</h3>
              <p className="text-muted-foreground mb-6">
                Join cycling clubs to connect with other riders and discover new routes
              </p>
              <Link href="/directory">
                <Button>
                  <Users className="w-4 h-4 mr-2" />
                  Browse Clubs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  // Handle leave club action
  const handleLeaveClub = async (clubId: string, clubName: string) => {
    if (confirm(`Are you sure you want to leave ${clubName}?`)) {
      try {
        await leaveClubMutation.mutateAsync(clubId)
      } catch (error) {
        console.error('Failed to leave club:', error)
        // Error handling is managed by the mutation hook
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Clubs</h1>
          <p className="text-muted-foreground">
            Manage your club memberships and stay connected with your cycling community
          </p>
        </div>

        {/* Club List */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Clubs ({clubs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clubs.map((membership) => (
                <div
                  key={membership.clubId}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Club Info */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{membership.clubName}</h3>
                          {membership.clubLocation && (
                            <p className="text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-4 h-4" />
                              {membership.clubLocation}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {membership.memberCount && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              {membership.memberCount} members
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Membership Status */}
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className="text-xs">
                          {membership.membershipRole}
                        </Badge>
                        <Badge
                          variant={membership.membershipStatus === "active" ? "default" : "outline"}
                          className="text-xs"
                        >
                          {membership.membershipStatus}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(membership.joinedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <Link href={`/clubs/${membership.clubId}`}>
                          <Button className="flex items-center gap-2">
                            View Club
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveClub(membership.clubId, membership.clubName)}
                          disabled={leaveClubMutation.isPending}
                        >
                          {leaveClubMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Leaving...
                            </>
                          ) : (
                            'Leave Club'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
