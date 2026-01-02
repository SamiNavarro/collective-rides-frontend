"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users, Route, CheckCircle, Navigation, Star, AlertTriangle } from "lucide-react"

export function RideLeaderDashboard() {
  const leaderStats = {
    assignedRides: 5,
    completedRides: 23,
    averageRating: 4.7,
    totalParticipants: 156,
    upcomingAssignments: 2,
  }

  const assignedRides = [
    {
      id: 1,
      name: "Northern Beaches Tour",
      date: "2024-12-20",
      time: "8:00 AM",
      captain: "Marcus Thompson",
      role: "Lead Rider",
      paceGroup: "Moderate (25-30 km/h)",
      participants: 8,
      meetingPoint: "Manly Wharf",
      distance: "22km",
      status: "confirmed",
    },
    {
      id: 2,
      name: "Hills Challenge",
      date: "2024-12-26",
      time: "6:30 AM",
      captain: "Sarah Chen",
      role: "Back Marker",
      paceGroup: "Advanced (30+ km/h)",
      participants: 6,
      meetingPoint: "Centennial Park",
      distance: "35km",
      status: "planning",
    },
  ]

  const recentRides = [
    {
      id: 1,
      name: "Harbour Bridge Loop",
      date: "2024-12-15",
      role: "Lead Rider",
      participants: 12,
      rating: 4.8,
      feedback: "Great pace setting and route knowledge",
    },
    {
      id: 2,
      name: "Eastern Suburbs Coastal",
      date: "2024-12-12",
      role: "Back Marker",
      participants: 10,
      rating: 4.6,
      feedback: "Excellent support for slower riders",
    },
  ]

  const responsibilities = {
    leadRider: [
      "Set and maintain pace for the group",
      "Navigate the planned route",
      "Communicate hazards and turns",
      "Ensure group stays together at intersections",
    ],
    backMarker: [
      "Support riders at the back of the group",
      "Assist with mechanical issues",
      "Communicate group status to captain",
      "Ensure no one gets left behind",
    ],
  }

  return (
    <div className="space-y-6">
      {/* Leader Overview */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Ride Leader Dashboard</h2>
        <p className="text-muted-foreground">Your assigned rides and leadership responsibilities</p>
      </div>

      {/* Leader Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Rides</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaderStats.assignedRides}</div>
            <p className="text-xs text-muted-foreground">{leaderStats.upcomingAssignments} upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Rides</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaderStats.completedRides}</div>
            <p className="text-xs text-muted-foreground">Total rides led</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaderStats.averageRating}</div>
            <p className="text-xs text-muted-foreground">From participant feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaderStats.totalParticipants}</div>
            <p className="text-xs text-muted-foreground">Riders supported</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Rides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              My Assigned Rides
            </CardTitle>
            <CardDescription>Rides where you have leadership responsibilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedRides.map((ride) => (
              <div key={ride.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{ride.name}</h4>
                  <Badge variant={ride.role === "Lead Rider" ? "default" : "secondary"}>{ride.role}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {ride.date} at {ride.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {ride.meetingPoint}
                  </div>
                  <div className="flex items-center gap-1">
                    <Route className="h-4 w-4" />
                    {ride.distance} • {ride.paceGroup}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Captain: {ride.captain} • {ride.participants} participants
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">View Details</Button>
                  <Button size="sm" variant="outline">
                    Contact Captain
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leadership Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Leadership Responsibilities
            </CardTitle>
            <CardDescription>Key duties for your assigned roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-blue-600" />
                Lead Rider Duties
              </h4>
              <ul className="space-y-2">
                {responsibilities.leadRider.map((duty, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {duty}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-600" />
                Back Marker Duties
              </h4>
              <ul className="space-y-2">
                {responsibilities.backMarker.map((duty, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {duty}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Recent Performance
          </CardTitle>
          <CardDescription>Feedback from your recent leadership roles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentRides.map((ride) => (
            <div key={ride.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium">{ride.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {ride.date} • {ride.role}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{ride.rating}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{ride.participants} participants</p>
              <p className="text-sm">{ride.feedback}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
