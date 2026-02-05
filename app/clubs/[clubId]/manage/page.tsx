"use client"

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { useClub, useClubMembersFiltered, useClubRides } from "@/hooks/use-clubs"
import { useAuth } from "@/contexts/auth-context"
import { MembersTab } from "@/components/club-management/members-tab"
import { RequestsTab } from "@/components/club-management/requests-tab"
import { DraftRidesTab } from "@/components/club-management/draft-rides-tab"

enum ManagementTab {
  MEMBERS = 'members',
  REQUESTS = 'requests',
  DRAFT_RIDES = 'draft-rides',
}

export default function ClubManagePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const clubId = params.clubId as string
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<ManagementTab>(
    (searchParams.get('tab') as ManagementTab) || ManagementTab.MEMBERS
  )

  const { data: club, isLoading: clubLoading } = useClub(clubId)
  
  // Fetch pending requests for badge count
  const { data: pendingRequests } = useClubMembersFiltered(clubId, {
    status: 'pending',
    enabled: !!club?.userMembership && ['owner', 'admin'].includes(club.userMembership.role)
  })
  
  // Fetch draft rides for badge count and display
  const { data: draftRides } = useClubRides(clubId, {
    status: 'draft',
    enabled: !!club?.userMembership && ['owner', 'admin', 'ride_captain', 'ride_leader'].includes(club.userMembership.role)
  })

  // Authorization check
  const canManageClub = useMemo(() => {
    if (!club?.userMembership) return false
    return ['owner', 'admin', 'ride_captain', 'ride_leader'].includes(club.userMembership.role)
  }, [club?.userMembership])

  // Calculate badge counts
  const requestsCount = pendingRequests?.length || 0
  const draftsCount = draftRides?.length || 0

  // Show Requests tab only if approval required
  const showRequestsTab = club?.membershipApprovalType === 'request_to_join'

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as ManagementTab)
    // Update URL without navigation
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    window.history.pushState({}, '', url)
  }

  // Loading state
  if (clubLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading club management...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Authorization check
  if (!canManageClub) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground text-center mb-6">
                You don't have permission to manage this club.
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
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Manage Club</h1>
              <p className="text-muted-foreground mt-1">{club?.name}</p>
            </div>
            <Link href={`/clubs/${clubId}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Club
              </Button>
            </Link>
          </div>

          {/* Management Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value={ManagementTab.MEMBERS}>
                Members
              </TabsTrigger>

              {showRequestsTab && (
                <TabsTrigger value={ManagementTab.REQUESTS}>
                  Requests
                  {requestsCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {requestsCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}

              <TabsTrigger value={ManagementTab.DRAFT_RIDES}>
                Draft Rides
                {draftsCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {draftsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            <TabsContent value={ManagementTab.MEMBERS} className="mt-6">
              <MembersTab 
                clubId={clubId} 
                currentUserRole={club?.userMembership?.role || 'member'} 
              />
            </TabsContent>

            {/* Requests Tab */}
            {showRequestsTab && (
              <TabsContent value={ManagementTab.REQUESTS} className="mt-6">
                <RequestsTab clubId={clubId} />
              </TabsContent>
            )}

            {/* Draft Rides Tab */}
            <TabsContent value={ManagementTab.DRAFT_RIDES} className="mt-6">
              <DraftRidesTab clubId={clubId} draftRides={draftRides || []} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
