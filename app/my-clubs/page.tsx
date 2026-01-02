"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Users,
  MapPin,
  Coffee,
  Shirt,
  Bell,
  Crown,
  Route,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Image from "next/image"
import Link from "next/link"

// Mock detailed club data
const getClubDetails = (clubId: string) => {
  const clubData = {
    "1": {
      id: "1",
      name: "Sydney Cycling Club",
      description:
        "Sydney's premier competitive cycling club with a strong focus on road racing and performance training.",
      area: "City & Inner West",
      members: 450,
      established: "1985",
      focus: "Road Racing & Training",
      pace: "Fast",
      image: "/sydney-cycling-club-racing-team.png",

      routes: [
        {
          id: "r1",
          name: "Harbour Bridge Circuit",
          distance: "45km",
          elevation: "320m",
          difficulty: "Moderate",
          description: "Classic Sydney route crossing the harbour bridge",
        },
        {
          id: "r2",
          name: "Eastern Suburbs Hills",
          distance: "62km",
          elevation: "890m",
          difficulty: "Hard",
          description: "Challenging hill climb through eastern suburbs",
        },
      ],

      schedule: [
        {
          day: "Tuesday",
          time: "6:00 AM",
          type: "Training Ride",
          pace: "Fast",
          distance: "40km",
          meetPoint: "Hyde Park Barracks",
        },
        {
          day: "Thursday",
          time: "6:00 AM",
          type: "Hill Training",
          pace: "Mixed",
          distance: "35km",
          meetPoint: "Centennial Park",
        },
        {
          day: "Saturday",
          time: "7:00 AM",
          type: "Group Ride",
          pace: "Fast",
          distance: "80km",
          meetPoint: "Hyde Park Barracks",
        },
      ],

      leaders: [
        {
          id: "l1",
          name: "Sarah Mitchell",
          role: "Head Coach",
          experience: "15 years",
          speciality: "Road Racing",
          avatar: "/placeholder-ruu56.png",
          bio: "Former professional cyclist with extensive coaching experience",
        },
        {
          id: "l2",
          name: "James Wilson",
          role: "Ride Captain",
          experience: "8 years",
          speciality: "Group Rides",
          avatar: "/placeholder-8aetr.png",
          bio: "Experienced ride leader focused on safety and inclusion",
        },
      ],

      jerseys: [
        {
          type: "Racing Jersey",
          colors: ["Navy", "White", "Red"],
          price: "$89",
          description: "Official club racing jersey with aerodynamic fit",
        },
        {
          type: "Training Jersey",
          colors: ["Navy", "Gray"],
          price: "$65",
          description: "Comfortable training jersey for everyday rides",
        },
      ],

      coffeeStops: [
        "The Grounds of Alexandria",
        "Celsius Coffee (Circular Quay)",
        "Single O (Surry Hills)",
        "Reuben Hills (Surry Hills)",
      ],

      guidelines: [
        "Helmets mandatory at all times",
        "Maintain group formation during rides",
        "Communicate hazards clearly",
        "Respect traffic laws and other road users",
        "Arrive 15 minutes before ride start time",
      ],

      history:
        "Founded in 1985, Sydney Cycling Club has been at the forefront of competitive cycling in NSW. With over 35 years of racing heritage, we've produced numerous state and national champions while maintaining our commitment to developing cycling talent at all levels.",
    },
    "2": {
      id: "2",
      name: "Eastern Suburbs Cycling Club",
      description: "Perfect balance of fitness and fun with scenic coastal routes and welcoming atmosphere.",
      area: "Eastern Suburbs",
      members: 280,
      established: "1992",
      focus: "Fitness & Social",
      pace: "Moderate",
      image: "/eastern-suburbs-cycling-club-coastal.png",

      routes: [
        {
          id: "r3",
          name: "Coastal Cruise",
          distance: "32km",
          elevation: "180m",
          difficulty: "Easy",
          description: "Scenic coastal ride from Bondi to Maroubra",
        },
      ],

      schedule: [
        {
          day: "Sunday",
          time: "8:00 AM",
          type: "Social Ride",
          pace: "Moderate",
          distance: "45km",
          meetPoint: "Centennial Park",
        },
      ],

      leaders: [
        {
          id: "l3",
          name: "Emma Thompson",
          role: "Club President",
          experience: "12 years",
          speciality: "Social Rides",
          avatar: "/placeholder-araqq.png",
          bio: "Passionate about building inclusive cycling communities",
        },
      ],

      jerseys: [
        {
          type: "Club Jersey",
          colors: ["Green", "White", "Black"],
          price: "$75",
          description: "Comfortable club jersey perfect for social rides",
        },
      ],

      coffeeStops: ["Porch & Parlour (Bondi Beach)", "The Depot (Randwick)", "Cornersmith (Annandale)"],

      guidelines: [
        "All skill levels welcome",
        "Safety first approach",
        "Supportive group environment",
        "Regular coffee stops included",
        "Family-friendly events",
      ],

      history:
        "Established in 1992, Eastern Suburbs Cycling Club was created to provide a welcoming environment for cyclists of all abilities. We focus on the social aspects of cycling while exploring the beautiful coastal routes of Sydney's east.",
    },
  }

  return clubData[clubId as keyof typeof clubData] || null
}

export default function MyClubsPage() {
  const { user, leaveClub, updatePreferences } = useAuth()
  const [selectedClub, setSelectedClub] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Please sign in to access your clubs</h1>
          <p className="text-muted-foreground">Sign in to manage your club memberships and activities</p>
        </div>
        <Footer />
      </div>
    )
  }

  const selectedClubDetails = selectedClub ? getClubDetails(selectedClub) : null
  const pendingApplicationsCount = (user.clubApplications || []).filter((app) => app.status === "pending").length

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

        {(user.joinedClubs || []).length === 0 && (user.clubApplications || []).length === 0 ? (
          // Empty State
          <Card className="text-center py-12 p-0">
            <CardContent className="px-6 pb-6 pt-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No clubs joined yet</h3>
              <p className="text-muted-foreground mb-6">
                Join cycling clubs to connect with other riders and discover new routes
              </p>
              <Link href="/clubs/directory">
                <Button>
                  <Users className="w-4 h-4 mr-2" />
                  Browse Clubs
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Club List */}
            <div className="lg:col-span-1">
              <Card className="p-0">
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Your Clubs ({(user.joinedClubs || []).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0 space-y-3">
                  {(user.joinedClubs || []).map((membership) => {
                    const clubDetails = getClubDetails(membership.clubId)
                    return (
                      <div
                        key={membership.clubId}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedClub === membership.clubId
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedClub(membership.clubId)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm">{membership.clubName}</h3>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {membership.role}
                          </Badge>
                          <Badge
                            variant={membership.membershipType === "active" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {membership.membershipType}
                          </Badge>
                        </div>
                        {clubDetails && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {clubDetails.members}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {clubDetails.area}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {(user.clubApplications || []).length > 0 && (
                <Card className="mt-6 p-0">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Pending Applications ({pendingApplicationsCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0 space-y-3">
                    {(user.clubApplications || []).map((application) => (
                      <div key={application.id} className="p-4 rounded-lg border border-orange-200 bg-orange-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm">{application.clubName}</h3>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              application.status === "pending"
                                ? "bg-orange-100 text-orange-700 border-orange-300"
                                : application.status === "approved"
                                  ? "bg-green-100 text-green-700 border-green-300"
                                  : "bg-red-100 text-red-700 border-red-300"
                            }`}
                          >
                            {application.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                            {application.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {application.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Applied on {new Date(application.applicationDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Experience: {application.experience}</div>
                        {application.status === "pending" && (
                          <div className="mt-2 text-xs text-orange-600">
                            Your application is being reviewed by club administrators
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Notifications Settings */}
              <Card className="mt-6 p-0">
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ride-reminders" className="text-sm">
                      Ride Reminders
                    </Label>
                    <Switch
                      id="ride-reminders"
                      checked={user.preferences.notifications.rideReminders}
                      onCheckedChange={(checked) =>
                        updatePreferences({
                          notifications: {
                            ...user.preferences.notifications,
                            rideReminders: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="club-updates" className="text-sm">
                      Club Updates
                    </Label>
                    <Switch
                      id="club-updates"
                      checked={user.preferences.notifications.clubUpdates}
                      onCheckedChange={(checked) =>
                        updatePreferences({
                          notifications: {
                            ...user.preferences.notifications,
                            clubUpdates: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-members" className="text-sm">
                      New Members
                    </Label>
                    <Switch
                      id="new-members"
                      checked={user.preferences.notifications.newMembers}
                      onCheckedChange={(checked) =>
                        updatePreferences({
                          notifications: {
                            ...user.preferences.notifications,
                            newMembers: checked,
                          },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Club Details */}
            <div className="lg:col-span-2">
              {selectedClubDetails ? (
                <Card className="p-0">
                  {/* Club Header */}
                  <div className="relative h-48 w-full">
                    <Image
                      src={selectedClubDetails.image || "/placeholder.svg"}
                      alt={`${selectedClubDetails.name} group`}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>

                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{selectedClubDetails.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {selectedClubDetails.area}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          {selectedClubDetails.members} members
                        </div>
                        <div className="text-xs text-muted-foreground">Est. {selectedClubDetails.established}</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 pb-6 pt-0">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="routes">Routes</TabsTrigger>
                        <TabsTrigger value="schedule">Schedule</TabsTrigger>
                        <TabsTrigger value="leaders">Leaders</TabsTrigger>
                        <TabsTrigger value="gear">Gear</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-6 mt-6">
                        <div>
                          <h4 className="font-semibold mb-2">About</h4>
                          <p className="text-sm text-muted-foreground">{selectedClubDetails.description}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Club Stats</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Focus:</span> {selectedClubDetails.focus}
                            </div>
                            <div>
                              <span className="font-medium">Pace:</span> {selectedClubDetails.pace}
                            </div>
                            <div>
                              <span className="font-medium">Active Members:</span> {selectedClubDetails.members}
                            </div>
                            <div>
                              <span className="font-medium">Established:</span> {selectedClubDetails.established}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Coffee className="w-4 h-4" />
                            Preferred Coffee Stops
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedClubDetails.coffeeStops.map((stop, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {stop}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Club History</h4>
                          <p className="text-sm text-muted-foreground">{selectedClubDetails.history}</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="routes" className="space-y-4 mt-6">
                        <h4 className="font-semibold">Regular Routes</h4>
                        {selectedClubDetails.routes.map((route) => (
                          <Card key={route.id} className="p-0">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-semibold">{route.name}</h5>
                                <Badge variant="outline">{route.difficulty}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{route.description}</p>
                              <div className="flex gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <Route className="w-4 h-4" />
                                  {route.distance}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {route.elevation}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>

                      <TabsContent value="schedule" className="space-y-4 mt-6">
                        <h4 className="font-semibold">Weekly Schedule</h4>
                        {selectedClubDetails.schedule.map((ride, idx) => (
                          <Card key={idx} className="p-0">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-semibold">{ride.type}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {ride.day} at {ride.time}
                                  </p>
                                </div>
                                <Badge variant="secondary">{ride.pace}</Badge>
                              </div>
                              <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <Route className="w-4 h-4" />
                                  {ride.distance}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {ride.meetPoint}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  {Math.floor(Math.random() * 15) + 5} riders expected
                                </span>
                                <Button size="sm" className="bg-primary hover:bg-primary/90">
                                  Join This Ride
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>

                      <TabsContent value="leaders" className="space-y-4 mt-6">
                        <h4 className="font-semibold">Club Leaders</h4>
                        {selectedClubDetails.leaders.map((leader) => (
                          <Card key={leader.id} className="p-0">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <Avatar>
                                  <AvatarImage src={leader.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {leader.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-semibold">{leader.name}</h5>
                                    {leader.role === "Head Coach" && <Crown className="w-4 h-4 text-yellow-500" />}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {leader.role} • {leader.experience}
                                  </p>
                                  <p className="text-sm mb-3">{leader.bio}</p>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="outline" className="text-xs">
                                      {leader.speciality}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                      Send Message
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                      View Profile
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        <Card className="p-0">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-lg">Connect with Members</CardTitle>
                            <CardDescription>Find and connect with other club members</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="space-y-3">
                              <Button className="w-full bg-transparent" variant="outline">
                                <Users className="w-4 h-4 mr-2" />
                                View Member Directory
                              </Button>
                              <Button className="w-full bg-transparent" variant="outline">
                                <Coffee className="w-4 h-4 mr-2" />
                                Find Riding Partners
                              </Button>
                              <Button className="w-full bg-transparent" variant="outline">
                                <MapPin className="w-4 h-4 mr-2" />
                                Join Local Groups
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="gear" className="space-y-4 mt-6">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Shirt className="w-4 h-4" />
                          Club Jerseys & Merchandise
                        </h4>
                        {selectedClubDetails.jerseys.map((jersey, idx) => (
                          <Card key={idx} className="p-0">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-semibold">{jersey.type}</h5>
                                <span className="font-semibold text-primary">{jersey.price}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{jersey.description}</p>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-medium">Colors:</span>
                                <div className="flex gap-1">
                                  {jersey.colors.map((color, colorIdx) => (
                                    <div
                                      key={colorIdx}
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{ backgroundColor: color.toLowerCase() }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              </div>
                              <Button size="sm" className="w-full">
                                Order {jersey.type}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        <Card className="p-0">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-lg">Additional Merchandise</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                              <Button variant="outline" size="sm">
                                Club Cap - $25
                              </Button>
                              <Button variant="outline" size="sm">
                                Water Bottle - $15
                              </Button>
                              <Button variant="outline" size="sm">
                                Cycling Socks - $18
                              </Button>
                              <Button variant="outline" size="sm">
                                Club Stickers - $5
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="settings" className="space-y-6 mt-6">
                        <div>
                          <h4 className="font-semibold mb-3">Club Guidelines</h4>
                          <ul className="space-y-2">
                            {selectedClubDetails.guidelines.map((guideline, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                {guideline}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-3 text-destructive">Danger Zone</h4>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Are you sure you want to leave ${selectedClubDetails.name}?`)) {
                                leaveClub(selectedClub!)
                                setSelectedClub(null)
                              }
                            }}
                          >
                            Leave Club
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card className="text-center py-12 p-0">
                  <CardContent className="px-6 pb-6 pt-12">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Select a club</h3>
                    <p className="text-muted-foreground">
                      Choose a club from the list to view detailed information and manage your membership
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
