"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Calendar, Users, Route, AlertCircle, CheckCircle, Star } from "lucide-react"

export function RideCaptainDashboard() {
  const captainStats = {
    totalRidesLed: 47,
    upcomingRides: 3,
    averageRating: 4.9,
    totalParticipants: 234,
    safetyRecord: "Excellent",
    completionRate: 98,
  }

  const upcomingRides = [
    {
      id: 1,
      name: "Harbour Bridge Loop",
      date: "2024-12-22",
      time: "7:00 AM",
      meetingPoint: "Circular Quay",
      distance: "25km",
      difficulty: "Moderate",
      participants: 12,
      maxParticipants: 15,
      status: "confirmed",
      weather: "Sunny, 22°C",
    },
    {
      id: 2,
      name: "Eastern Suburbs Coastal",
      date: "2024-12-24",
      time: "8:00 AM",
      meetingPoint: "Bondi Beach",
      distance: "18km",
      difficulty: "Easy",
      participants: 8,
      maxParticipants: 12,
      status: "confirmed",
      weather: "Partly cloudy, 20°C",
    },
    {
      id: 3,
      name: "Hills Challenge",
      date: "2024-12-26",
      time: "6:30 AM",
      meetingPoint: "Centennial Park",
      distance: "35km",
      difficulty: "Hard",
      participants: 6,
      maxParticipants: 10,
      status: "planning",
      weather: "TBD",
    },
  ]

  const recentFeedback = [
    {
      id: 1,
      rider: "Emma S.",
      rating: 5,
      comment: "Excellent leadership and route planning. Felt safe throughout the ride.",
      ride: "Morning Coastal Loop",
      date: "2024-12-15",
    },
    {
      id: 2,
      rider: "Mike T.",
      rating: 5,
      comment: "Great pace management and clear communication. Would ride again!",
      ride: "City to Beach",
      date: "2024-12-12",
    },
  ]

  const safetyChecklist = [
    { item: "Route safety assessment", completed: true },
    { item: "Weather conditions check", completed: true },
    { item: "Emergency contact list", completed: true },
    { item: "First aid kit prepared", completed: false },
    { item: "Backup route planned", completed: true },
  ]

  return (
    <div className="space-y-6">
      {/* Captain Overview */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Ride Captain Dashboard</h2>
        <p className="text-muted-foreground">Manage your rides, participants, and safety protocols</p>
      </div>

      {/* Captain Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rides Led</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{captainStats.totalRidesLed}</div>
            <p className="text-xs text-muted-foreground">{captainStats.completionRate}% completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Rides</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{captainStats.upcomingRides}</div>
            <p className="text-xs text-muted-foreground">Next ride in 2 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{captainStats.averageRating}</div>
            <p className="text-xs text-muted-foreground">From {captainStats.totalParticipants} participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Record</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{captainStats.safetyRecord}</div>
            <p className="text-xs text-muted-foreground">Zero incidents this year</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Rides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Upcoming Rides
            </CardTitle>
            <CardDescription>Rides you're leading as captain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingRides.map((ride) => (
              <div key={ride.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{ride.name}</h4>
                  <Badge variant={ride.status === "confirmed" ? "default" : "secondary"}>{ride.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
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
                    {ride.distance} • {ride.difficulty}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {ride.participants}/{ride.maxParticipants} riders
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">Manage Ride</Button>
                  <Button size="sm" variant="outline">
                    Message Participants
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Safety Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Pre-Ride Safety Checklist
            </CardTitle>
            <CardDescription>Essential safety preparations for next ride</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {safetyChecklist.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg border">
                {item.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <span className={`flex-1 ${item.completed ? "text-muted-foreground line-through" : ""}`}>
                  {item.item}
                </span>
                {!item.completed && (
                  <Button size="sm" variant="outline">
                    Complete
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Recent Participant Feedback
          </CardTitle>
          <CardDescription>Reviews from your recent rides</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentFeedback.map((feedback) => (
            <div key={feedback.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {feedback.rider
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{feedback.rider}</p>
                    <p className="text-sm text-muted-foreground">
                      {feedback.ride} • {feedback.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(feedback.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <p className="text-sm">{feedback.comment}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
