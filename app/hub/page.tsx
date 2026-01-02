"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SiteAdminDashboard } from "@/components/dashboards/site-admin-dashboard"
import { ClubAdminDashboard } from "@/components/dashboards/club-admin-dashboard"
import { RideCaptainDashboard } from "@/components/dashboards/ride-captain-dashboard"
import { RideLeaderDashboard } from "@/components/dashboards/ride-leader-dashboard"
import { RiderDashboard } from "@/components/dashboards/rider-dashboard"

const SYDNEY_SUBURBS = [
  "Bondi Beach",
  "Manly",
  "Surry Hills",
  "Newtown",
  "Paddington",
  "Balmain",
  "Leichhardt",
  "Glebe",
  "Coogee",
  "Bronte",
  "Randwick",
  "Kensington",
  "Alexandria",
  "Redfern",
  "Darlinghurst",
  "Potts Point",
  "Kings Cross",
  "Woollahra",
  "Double Bay",
  "Rose Bay",
  "Vaucluse",
  "Watsons Bay",
]

// Mock data based on suburb
const getLocalContent = (suburb: string) => ({
  routes: [
    {
      id: 1,
      name: `${suburb} Coastal Loop`,
      distance: "12km",
      difficulty: "Easy",
      rating: 4.8,
      description: `Scenic coastal ride starting from ${suburb}`,
    },
    {
      id: 2,
      name: `${suburb} to City`,
      distance: "8km",
      difficulty: "Moderate",
      rating: 4.6,
      description: `Direct route from ${suburb} to Sydney CBD`,
    },
  ],
  cafes: [
    {
      id: 1,
      name: `${suburb} Cycle Café`,
      rating: 4.9,
      bikeParking: "Excellent",
      openHours: "6:00 AM - 4:00 PM",
      specialty: "Flat White & Acai Bowls",
    },
    {
      id: 2,
      name: `The Local Grind`,
      rating: 4.7,
      bikeParking: "Good",
      openHours: "7:00 AM - 3:00 PM",
      specialty: "Single Origin Coffee",
    },
  ],
  rides: [
    {
      id: 1,
      title: `${suburb} Morning Ride`,
      date: "Tomorrow",
      time: "7:00 AM",
      pace: "Social",
      attendees: 8,
      organizer: "Sarah M.",
    },
    {
      id: 2,
      title: "Weekend Coffee Cruise",
      date: "Saturday",
      time: "9:00 AM",
      pace: "Leisurely",
      attendees: 12,
      organizer: "Mike T.",
    },
  ],
  clubs: [
    {
      id: 1,
      name: `${suburb} Cycling Club`,
      members: 156,
      focus: "Social Rides",
      meetingDay: "Sundays",
    },
  ],
  shops: [
    {
      id: 1,
      name: `${suburb} Bike Works`,
      rating: 4.8,
      services: ["Repairs", "Tune-ups", "Parts"],
      openHours: "9:00 AM - 6:00 PM",
    },
  ],
})

export default function HubPage() {
  const { user, isSiteAdmin, getUserRole } = useAuth()
  const [selectedSuburb, setSelectedSuburb] = useState(user?.suburb || "Bondi Beach")
  const [localContent, setLocalContent] = useState(getLocalContent(selectedSuburb))

  useEffect(() => {
    setLocalContent(getLocalContent(selectedSuburb))
  }, [selectedSuburb])

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Please sign in to access your local hub</h1>
          <p className="text-muted-foreground">Sign in to get personalized local cycling content</p>
        </div>
        <Footer />
      </div>
    )
  }

  const renderDashboard = () => {
    if (isSiteAdmin()) {
      return <SiteAdminDashboard />
    }

    // Check if user has club admin role in any club
    const adminClubs = user.joinedClubs.filter((club) => club.role === "club_admin")
    if (adminClubs.length > 0) {
      return <ClubAdminDashboard clubId={adminClubs[0].clubId} clubName={adminClubs[0].clubName} />
    }

    // Check if user has ride captain role
    const captainClubs = user.joinedClubs.filter((club) => club.role === "ride_captain")
    if (captainClubs.length > 0) {
      return <RideCaptainDashboard />
    }

    // Check if user has ride leader role
    const leaderClubs = user.joinedClubs.filter((club) => club.role === "ride_leader")
    if (leaderClubs.length > 0) {
      return <RideLeaderDashboard />
    }

    // Default to rider dashboard
    return <RiderDashboard />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">{renderDashboard()}</div>
      <Footer />
    </div>
  )
}
