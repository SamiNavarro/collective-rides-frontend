"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Calendar, UserPlus, MessageSquare, TrendingUp, Settings, Clock, Star } from "lucide-react"

interface ClubAdminDashboardProps {
  clubId: string
  clubName: string
}

export function ClubAdminDashboard({ clubId, clubName }: ClubAdminDashboardProps) {
  const clubStats = {
    totalMembers: 89,
    activeRides: 12,
    pendingApplications: 5,
    monthlyGrowth: 15,
    averageRating: 4.8,
    upcomingEvents: 3,
  }

  const pendingApplications = [
    {
      id: 1,
      name: "Alex Johnson",
      experience: "Intermediate",
      appliedDate: "2024-12-18",
      motivation: "Looking to join regular group rides and improve fitness",
    },
    {
      id: 2,
      name: "Emma Wilson",
      experience: "Beginner",
      appliedDate: "2024-12-17",
      motivation: "New to cycling, want to learn from experienced riders",
    },
    {
      id: 3,
      name: "David Chen",
      experience: "Advanced",
      appliedDate: "2024-12-16",
      motivation: "Experienced rider looking for challenging group rides",
    },
  ]

  const upcomingRides = [
    {
      id: 1,
      name: "Morning Harbour Loop",
      date: "2024-12-22",
      time: "7:00 AM",
      captain: "Sarah M.",
      participants: 12,
      maxParticipants: 15,
    },
    {
      id: 2,
      name: "Weekend Coffee Cruise",
      date: "2024-12-23",
      time: "9:00 AM",
      captain: "Mike T.",
      participants: 8,
      maxParticipants: 12,
    },
  ]

  const recentActivity = [
    { type: "member_joined", message: "New member joined: Lisa Park", time: "1 hour ago" },
    { type: "ride_created", message: "New ride scheduled: Evening Hills Challenge", time: "3 hours ago" },
    { type: "application_received", message: "New membership application from Tom Wilson", time: "5 hours ago" },
  ]

  return (
    <div className="space-y-6">
      {/* Club Overview */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{clubName} - Admin Dashboard</h2>
        <p className="text-muted-foreground">Manage your club members, rides, and activities</p>
      </div>

      {/* Club Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubStats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />+{clubStats.monthlyGrowth}% this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rides</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubStats.activeRides}</div>
            <p className="text-xs text-muted-foreground">{clubStats.upcomingEvents} upcoming events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubStats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Club Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubStats.averageRating}</div>
            <p className="text-xs text-muted-foreground">Based on member feedback</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Pending Applications
            </CardTitle>
            <CardDescription>New membership requests awaiting approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingApplications.map((application) => (
              <div key={application.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {application.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{application.name}</h4>
                      <p className="text-sm text-muted-foreground">Applied {application.appliedDate}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{application.experience}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{application.motivation}</p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Approve
                  </Button>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                  <Button size="sm" variant="destructive">
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Rides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Rides
            </CardTitle>
            <CardDescription>Scheduled club rides and events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingRides.map((ride) => (
              <div key={ride.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{ride.name}</h4>
                  <Badge variant="outline">
                    {ride.participants}/{ride.maxParticipants} riders
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {ride.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {ride.time}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Captain: {ride.captain}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Edit Ride
                  </Button>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common club management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Calendar className="h-5 w-5" />
              Create Ride
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Users className="h-5 w-5" />
              Manage Members
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <MessageSquare className="h-5 w-5" />
              Send Message
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Settings className="h-5 w-5" />
              Club Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
