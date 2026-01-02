"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, Users, Plus, MessageCircle, Star } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CreateRideDialog } from "@/components/rides/create-ride-dialog"
import { RideDetailsDialog } from "@/components/rides/ride-details-dialog"
import { FindBuddiesDialog } from "@/components/rides/find-buddies-dialog"

// Mock rides data
const mockRides = [
  {
    id: 1,
    title: "Morning Harbour Bridge Loop",
    organizer: { name: "Sarah M.", avatar: "SM" },
    date: "2024-01-15",
    time: "07:00",
    location: "Circular Quay",
    distance: "25km",
    pace: "Moderate",
    difficulty: "Intermediate",
    attendees: 8,
    maxAttendees: 12,
    description: "Beautiful morning ride across the Harbour Bridge with coffee stop at Milsons Point",
    route: "Circular Quay → Harbour Bridge → Milsons Point → Return",
    isJoined: false,
  },
  {
    id: 2,
    title: "Bondi to Coogee Coastal Cruise",
    organizer: { name: "Mike T.", avatar: "MT" },
    date: "2024-01-16",
    time: "09:00",
    location: "Bondi Beach",
    distance: "15km",
    pace: "Leisurely",
    difficulty: "Beginner",
    attendees: 15,
    maxAttendees: 20,
    description: "Relaxed coastal ride with plenty of photo stops and beach views",
    route: "Bondi Beach → Bronte → Clovelly → Coogee",
    isJoined: true,
  },
  {
    id: 3,
    title: "Blue Mountains Challenge",
    organizer: { name: "Alex R.", avatar: "AR" },
    date: "2024-01-20",
    time: "08:00",
    location: "Katoomba",
    distance: "45km",
    pace: "Fast",
    difficulty: "Advanced",
    attendees: 6,
    maxAttendees: 10,
    description: "Challenging hill climb through the Blue Mountains with stunning views",
    route: "Katoomba → Leura → Wentworth Falls → Return",
    isJoined: false,
  },
]

const suggestedBuddies = [
  {
    id: 1,
    name: "Emma K.",
    avatar: "EK",
    location: "Bondi Beach",
    level: "Intermediate",
    interests: ["Road Cycling", "Coffee Rides"],
    compatibility: 95,
  },
  {
    id: 2,
    name: "James L.",
    avatar: "JL",
    location: "Manly",
    level: "Advanced",
    interests: ["Hill Climbing", "Long Distance"],
    compatibility: 88,
  },
  {
    id: 3,
    name: "Sophie W.",
    avatar: "SW",
    location: "Surry Hills",
    level: "Beginner",
    interests: ["Casual Rides", "Social"],
    compatibility: 92,
  },
]

export default function RidesPage() {
  const { user } = useAuth()
  const [rides, setRides] = useState(mockRides)
  const [createRideOpen, setCreateRideOpen] = useState(false)
  const [selectedRide, setSelectedRide] = useState<(typeof mockRides)[0] | null>(null)
  const [findBuddiesOpen, setFindBuddiesOpen] = useState(false)

  const handleJoinRide = (rideId: number) => {
    setRides(
      rides.map((ride) =>
        ride.id === rideId
          ? { ...ride, isJoined: !ride.isJoined, attendees: ride.isJoined ? ride.attendees - 1 : ride.attendees + 1 }
          : ride,
      ),
    )
  }

  const handleCreateRide = (rideData: any) => {
    const newRide = {
      id: rides.length + 1,
      ...rideData,
      organizer: { name: user?.name || "You", avatar: user?.name?.charAt(0).toUpperCase() || "U" },
      attendees: 1,
      isJoined: true,
    }
    setRides([newRide, ...rides])
    setCreateRideOpen(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Please sign in to access rides</h1>
          <p className="text-muted-foreground">Sign in to create and join cycling rides</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col gap-4 mb-6 md:mb-8 md:flex-row md:justify-between md:items-center">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Cycling Rides</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Join rides or create your own cycling adventures
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center md:justify-end">
            <Button onClick={() => setFindBuddiesOpen(true)} variant="outline" className="w-full sm:w-auto">
              <Users className="w-4 h-4 mr-2" />
              Find Buddies
            </Button>
            <Button onClick={() => setCreateRideOpen(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Ride
            </Button>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="upcoming" className="text-xs sm:text-sm py-2">
              Upcoming Rides
            </TabsTrigger>
            <TabsTrigger value="my-rides" className="text-xs sm:text-sm py-2">
              My Rides
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs sm:text-sm py-2">
              Past Rides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {rides.map((ride) => (
              <Card key={ride.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-4">
                    {/* Header section with title and organizer */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <h3 className="text-lg md:text-xl font-semibold leading-tight">{ride.title}</h3>
                          <Badge
                            variant={
                              ride.difficulty === "Beginner"
                                ? "secondary"
                                : ride.difficulty === "Intermediate"
                                  ? "default"
                                  : "destructive"
                            }
                            className="w-fit"
                          >
                            {ride.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{ride.organizer.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{ride.organizer.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ride.attendees}/{ride.maxAttendees} riders
                        </div>
                      </div>
                    </div>

                    {/* Date, time, location info */}
                    <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{new Date(ride.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{ride.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{ride.location}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{ride.description}</p>

                    {/* Distance and pace badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{ride.distance}</Badge>
                      <Badge variant="outline">{ride.pace}</Badge>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between sm:items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRide(ride)}
                        className="w-full sm:w-auto"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        onClick={() => handleJoinRide(ride.id)}
                        variant={ride.isJoined ? "secondary" : "default"}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        {ride.isJoined ? "Leave Ride" : "Join Ride"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="my-rides" className="space-y-4">
            {rides
              .filter((ride) => ride.isJoined)
              .map((ride) => (
                <Card key={ride.id}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                      <div className="space-y-3">
                        <h3 className="text-lg md:text-xl font-semibold">{ride.title}</h3>
                        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(ride.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{ride.time}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="w-fit">
                          Joined
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRide(ride)}
                        className="w-full sm:w-auto"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm md:text-base">No past rides yet. Join some rides to see your cycling history!</p>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mt-6 md:mt-8">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Users className="w-5 h-5" />
              Suggested Ride Buddies
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Connect with cyclists who match your interests and location
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestedBuddies.map((buddy) => (
                <div key={buddy.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{buddy.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm md:text-base truncate">{buddy.name}</h4>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{buddy.location}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <span className="text-sm">{buddy.compatibility}% match</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {buddy.level}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {buddy.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm" className="w-full mt-3">
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />

      <CreateRideDialog
        isOpen={createRideOpen}
        onClose={() => setCreateRideOpen(false)}
        onCreateRide={handleCreateRide}
      />

      {selectedRide && (
        <RideDetailsDialog
          ride={selectedRide}
          isOpen={!!selectedRide}
          onClose={() => setSelectedRide(null)}
          onJoinRide={() => handleJoinRide(selectedRide.id)}
        />
      )}

      <FindBuddiesDialog
        isOpen={findBuddiesOpen}
        onClose={() => setFindBuddiesOpen(false)}
        buddies={suggestedBuddies}
      />
    </div>
  )
}
