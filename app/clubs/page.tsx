"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, MapPin, Calendar, Phone, Mail, ExternalLink, Heart, ArrowRight, UserPlus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function ClubsInfoPage() {
  const { user } = useAuth()

  const cyclingClubs = [
    {
      id: "sydney-cycling-club",
      name: "Sydney Cycling Club",
      area: "City & Inner West",
      members: 450,
      established: "1985",
      focus: "Road Racing & Training",
      pace: "Fast",
      weeklyRides: 4,
      meetingDay: "Wednesday 7:00 PM",
      contact: "info@sydneycycling.com.au",
      phone: "(02) 9555 0123",
      website: "sydneycycling.com.au",
      description:
        "Sydney's premier competitive cycling club with a strong focus on road racing and performance training.",
      rideTypes: ["Road Racing", "Time Trials", "Training Rides", "Hill Climbs"],
      beginnerFriendly: false,
      membershipFee: "$120/year",
      kitColors: ["Navy", "White", "Red"],
      image: "/sydney-cycling-club-racing-team.png",
    },
    {
      id: "manly-warringah-cycling-club",
      name: "Manly Warringah Cycling Club",
      area: "Northern Beaches",
      members: 320,
      established: "1978",
      focus: "Social & Recreational",
      pace: "Mixed",
      weeklyRides: 3,
      meetingDay: "Tuesday 7:30 PM",
      contact: "secretary@mwcc.org.au",
      phone: "(02) 9977 4567",
      website: "mwcc.org.au",
      description: "Friendly club welcoming all levels with beautiful Northern Beaches routes and strong social focus.",
      rideTypes: ["Social Rides", "Beach Routes", "Coffee Rides", "Weekend Tours"],
      beginnerFriendly: true,
      membershipFee: "$80/year",
      kitColors: ["Blue", "Yellow", "White"],
      image: "/manly-warringah-cycling-club-beach.png",
    },
    {
      id: "eastern-suburbs-cycling-club",
      name: "Eastern Suburbs Cycling Club",
      area: "Eastern Suburbs",
      members: 280,
      established: "1992",
      focus: "Fitness & Social",
      pace: "Moderate",
      weeklyRides: 3,
      meetingDay: "Monday 7:00 PM",
      contact: "rides@escc.com.au",
      phone: "(02) 9387 8901",
      website: "escc.com.au",
      description: "Perfect balance of fitness and fun with scenic coastal routes and welcoming atmosphere.",
      rideTypes: ["Coastal Rides", "Park Loops", "Café Stops", "Skills Sessions"],
      beginnerFriendly: true,
      membershipFee: "$90/year",
      kitColors: ["Green", "White", "Black"],
      image: "/eastern-suburbs-cycling-club-coastal.png",
    },
    {
      id: "inner-west-cycling-collective",
      name: "Inner West Cycling Collective",
      area: "Inner West",
      members: 180,
      established: "2010",
      focus: "Community & Advocacy",
      pace: "Relaxed",
      weeklyRides: 2,
      meetingDay: "Thursday 7:00 PM",
      contact: "hello@iwcc.org",
      phone: "(02) 9560 2345",
      website: "iwcc.org",
      description: "Community-focused club promoting cycling advocacy and inclusive group rides for all abilities.",
      rideTypes: ["Community Rides", "Family Rides", "Advocacy Events", "Skills Workshops"],
      beginnerFriendly: true,
      membershipFee: "$60/year",
      kitColors: ["Orange", "Black", "White"],
      image: "/inner-west-cycling-collective-community.png",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Sydney Cycling Clubs</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Discover Sydney's vibrant cycling community. Learn about local clubs, their focus areas, and what makes each
            one unique.
          </p>

          {user ? (
            <Link href="/clubs/directory">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold">
                <UserPlus className="w-5 h-5 mr-2" />
                Browse & Join Clubs
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Join a Club?</h3>
              <p className="text-blue-700 mb-4">
                Sign in to access our club directory and apply to join clubs that match your interests.
              </p>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                <UserPlus className="w-5 h-5 mr-2" />
                Sign In to Get Started
              </Button>
            </div>
          )}
        </div>

        {/* Featured Clubs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Featured Clubs</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {cyclingClubs.map((club, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden p-0">
                <div className="relative h-48 w-full">
                  <Image
                    src={club.image || "/placeholder.svg"}
                    alt={`${club.name} cycling group`}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{club.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {club.area}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4" />
                        {club.members} members
                      </div>
                      <div className="text-xs text-gray-500">Est. {club.established}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  <p className="text-sm text-gray-600">{club.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Focus:</span> {club.focus}
                    </div>
                    <div>
                      <span className="font-medium">Pace:</span> {club.pace}
                    </div>
                    <div>
                      <span className="font-medium">Weekly Rides:</span> {club.weeklyRides}
                    </div>
                    <div>
                      <span className="font-medium">Membership:</span> {club.membershipFee}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Meetings: {club.meetingDay}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {club.rideTypes.map((type, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                    {club.beginnerFriendly && (
                      <Badge className="bg-green-100 text-green-800">
                        <Heart className="w-3 h-3 mr-1" />
                        Beginner Friendly
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4" />
                      {club.contact}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4" />
                      {club.phone}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {club.kitColors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.toLowerCase() }}
                            title={color}
                          />
                        ))}
                      </div>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visit Website
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How to Join Section */}
        <Card className="mb-8 p-0">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              How to Join a Cycling Club
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Research & Contact</h4>
                <p className="text-sm text-gray-600">
                  Find clubs that match your interests, pace, and location. Contact them via email or phone.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Attend a Ride</h4>
                <p className="text-sm text-gray-600">
                  Most clubs welcome visitors. Join a group ride to experience the club culture and pace.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Join & Participate</h4>
                <p className="text-sm text-gray-600">
                  Complete membership forms, pay fees, and start participating in regular rides and events.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-8 border border-orange-200">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your Club Journey?</h3>
          <p className="mb-6 text-muted-foreground">
            {user
              ? "Access our club directory to apply and join clubs that match your interests."
              : "Sign in to access our club directory and start connecting with Sydney's cycling community."}
          </p>
          {user ? (
            <Link href="/clubs/directory">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <UserPlus className="w-5 h-5 mr-2" />
                Access Club Directory
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Sign In to Get Started
            </Button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}