"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users, Clock, Route, Star, TrendingUp, Award, Target, Activity } from "lucide-react"

export function RiderDashboard() {
  const riderStats = {
    totalRides: 34,
    totalDistance: 847,
    averageSpeed: 24.5,
    favoriteRoute: "Harbour Bridge Loop",
    ridesThisMonth: 8,
    clubsJoined: 2,
  }

  const upcomingRides = [
    {
      id: 1,
      name: "Harbour Bridge Loop",
      date: "2024-12-22",
      time: "7:00 AM",
      club: "Sydney Cycling Club",
      captain: "Marcus Thompson",
      distance: "25km",
      difficulty: "Moderate",
      meetingPoint: "Circular Quay",
      participants: 12,
      maxParticipants: 15,
    },
    {
      id: 2,
      name: "Weekend Coffee Cruise",
      date: "2024-12-23",
      time: "9:00 AM",
      club: "Eastern Suburbs Cycling Club",
      captain: "Sarah Chen",
      distance: "18km",
      difficulty: "Easy",
      meetingPoint: "Bondi Beach",
      participants: 8,
      maxParticipants: 12,
    },
  ]

  const recentRides = [
    {
      id: 1,
      name: "Eastern Suburbs Coastal",
      date: "2024-12-15",
      distance: "22km",
      duration: "1h 15m",
      averageSpeed: "26.4 km/h",
      club: "Sydney Cycling Club",
      rating: 5,
    },
    {
      id: 2,
      name: "City to Beach",
      date: "2024-12-12",
      distance: "18km",
      duration: "58m",
      averageSpeed: "23.1 km/h",
      club: "Eastern Suburbs Cycling Club",
      rating: 4,
    },
  ]

  const achievements = [
    { name: "First Ride", description: "Completed your first group ride", earned: true },
    { name: "Regular Rider", description: "Joined 10 group rides", earned: true },
    { name: "Distance Warrior", description: "Rode 500km total", earned: true },
    { name: "Speed Demon", description: "Maintained 30+ km/h average", earned: false },
    { name: "Social Butterfly", description: "Joined 3 different clubs", earned: false },
  ]

  const goals = [
    { name: "Ride 50km in a month", progress: 67, target: 50, current: 33.5 },
    { name: "Join 5 rides this month", progress: 80, target: 5, current: 4 },
    { name: "Try a new route", progress: 100, target: 1, current: 1 },
  ]

  return (
    <div className="space-y-6">
      {/* Rider Overview */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">My Cycling Dashboard</h2>
        <p className="text-muted-foreground">Track your rides, progress, and connect with the cycling community</p>
      </div>

      {/* Rider Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riderStats.totalRides}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {riderStats.ridesThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riderStats.totalDistance}km</div>
            <p className="text-xs text-muted-foreground">Lifetime distance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Speed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riderStats.averageSpeed} km/h</div>
            <p className="text-xs text-muted-foreground">Across all rides</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clubs Joined</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riderStats.clubsJoined}</div>
            <p className="text-xs text-muted-foreground">Active memberships</p>
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
            <CardDescription>Rides you've signed up for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingRides.map((ride) => (
              <div key={ride.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{ride.name}</h4>
                  <Badge variant="outline">{ride.difficulty}</Badge>
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
                    {ride.distance} • {ride.club}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {ride.participants}/{ride.maxParticipants} riders • Captain: {ride.captain}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">View Details</Button>
                  <Button size="sm" variant="outline">
                    Leave Ride
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Personal Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Personal Goals
            </CardTitle>
            <CardDescription>Track your cycling objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.map((goal, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{goal.name}</h4>
                  <Badge variant={goal.progress === 100 ? "default" : "secondary"}>{goal.progress}%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {goal.current} / {goal.target}{" "}
                  {goal.name.includes("km") ? "km" : goal.name.includes("rides") ? "rides" : "completed"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Rides
            </CardTitle>
            <CardDescription>Your latest cycling activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRides.map((ride) => (
              <div key={ride.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{ride.name}</h4>
                  <div className="flex items-center gap-1">
                    {[...Array(ride.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {ride.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Route className="h-4 w-4" />
                    {ride.distance}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {ride.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {ride.averageSpeed}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{ride.club}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
            <CardDescription>Your cycling milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`border rounded-lg p-3 ${achievement.earned ? "bg-green-50 border-green-200" : "bg-gray-50"}`}
              >
                <div className="flex items-center gap-3">
                  <Award className={`h-5 w-5 ${achievement.earned ? "text-green-600" : "text-gray-400"}`} />
                  <div className="flex-1">
                    <h4 className={`font-medium ${achievement.earned ? "text-green-800" : "text-gray-600"}`}>
                      {achievement.name}
                    </h4>
                    <p className={`text-sm ${achievement.earned ? "text-green-600" : "text-gray-500"}`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.earned && (
                    <Badge variant="default" className="bg-green-600">
                      Earned
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
