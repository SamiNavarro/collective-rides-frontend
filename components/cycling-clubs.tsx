"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, Clock, Zap, Heart } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export function CyclingClubs() {
  const { user } = useAuth()

  const clubs = [
    {
      name: "Sydney Cycling Club",
      location: "CBD & Eastern Suburbs",
      members: "200+",
      pace: "Mixed",
      rideTypes: ["Road", "Social", "Training"],
      weeklyRides: "Tuesday 6:30 AM, Saturday 7:00 AM, Sunday 8:00 AM",
      description:
        "Sydney's oldest cycling club welcoming riders of all levels. Regular bunch rides, social events, and beginner programs.",
      beginnerFriendly: true,
      image: "/sydney-cycling-club.png",
    },
    {
      name: "Northern Beaches Cyclists",
      location: "Northern Beaches",
      members: "150+",
      pace: "Moderate-Fast",
      rideTypes: ["Road", "Hills", "Coastal"],
      weeklyRides: "Wednesday 6:00 AM, Saturday 6:30 AM, Sunday 7:30 AM",
      description: "Explore the stunning northern beaches and hinterland with this friendly, well-organized club.",
      beginnerFriendly: true,
      image: "/northern-beaches-cycling-group.png",
    },
    {
      name: "Inner West Wheelers",
      location: "Inner West",
      members: "120+",
      pace: "Social-Moderate",
      rideTypes: ["Urban", "Park", "Coffee"],
      weeklyRides: "Thursday 6:30 AM, Saturday 8:00 AM, Sunday 9:00 AM",
      description: "Relaxed rides through Sydney's inner west with plenty of coffee stops and community focus.",
      beginnerFriendly: true,
      image: "/inner-west-sydney-coffee-ride.png",
    },
  ]

  const getPaceColor = (pace: string) => {
    switch (pace) {
      case "Social-Moderate":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Mixed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Moderate-Fast":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <section id="clubs" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Join a Cycling Club</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with Sydney's vibrant cycling community. Find your perfect riding group and make new friends.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {clubs.map((club, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow p-0">
              <div className="aspect-video bg-muted">
                <img src={club.image || "/placeholder.svg"} alt={club.name} className="w-full h-full object-cover" />
              </div>

              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-xl">{club.name}</CardTitle>
                      {club.beginnerFriendly && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Heart className="w-3 h-3 mr-1" />
                          Beginner Friendly
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{club.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{club.members} members</span>
                      </div>
                    </div>
                  </div>

                  <Badge className={getPaceColor(club.pace)}>
                    <Zap className="w-3 h-3 mr-1" />
                    {club.pace}
                  </Badge>
                </div>

                <CardDescription className="text-base">{club.description}</CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6 pt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Ride Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {club.rideTypes.map((type, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Weekly Rides</span>
                    </h4>
                    <p className="text-sm text-muted-foreground">{club.weeklyRides}</p>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button className="flex-1">Join Club</Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="space-y-4">
            <Link href={user ? "/clubs/directory" : "/clubs"} className="inline-block">
              <Button
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                onClick={() =>
                  console.log("[v0] Browse Clubs button clicked - navigating to", user ? "/clubs/directory" : "/clubs")
                }
              >
                🚴‍♂️ {user ? "Browse & Join Clubs" : "Browse All Clubs"}
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {user
                ? "Access our club directory to apply and join clubs that match your interests."
                : "Discover 20+ cycling clubs across Sydney. Sign in to apply and join clubs."}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
