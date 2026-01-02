"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Settings,
  Users,
  Calendar,
  MessageSquare,
  Upload,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  Mail,
  Shield,
  Camera,
  MoreVertical,
  Eye,
  TrendingUp,
  X,
  Phone,
  Award,
  BarChart3,
} from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"

export default function ClubAdminPage() {
  const { user, getAdminClubs, isClubAdmin } = useAuth()
  const router = useRouter()
  const [selectedClub, setSelectedClub] = useState<string>("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddLeaderModal, setShowAddLeaderModal] = useState(false)
  const [newLeaderData, setNewLeaderData] = useState({
    name: "",
    email: "",
    bio: "",
    specialties: "",
    experience: "",
    achievements: "",
    profileImage: "",
    cyclingStats: {
      totalDistance: "",
      avgSpeed: "",
      longestRide: "",
      yearsExperience: "",
    },
  })

  const [showPromoteDialog, setShowPromoteDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedLeader, setSelectedLeader] = useState<any>(null)
  const [promotionRole, setPromotionRole] = useState("")

  const [leaders, setLeaders] = useState([
    {
      id: "captain-test-1",
      name: "Marcus Thompson",
      email: "marcus.thompson@example.com",
      role: "Ride Captain",
      bio: "Experienced cycling captain with 12+ years of group leadership and safety management. Specializes in long-distance rides and mentoring new cyclists.",
      specialties: ["Long Distance", "Safety Management", "Route Planning", "Group Leadership"],
      avatar: "/placeholder.svg",
      joinedDate: "2022-03-15",
      cyclingStats: {
        totalDistance: "25,000",
        avgSpeed: "32",
        longestRide: "300",
        yearsExperience: "12",
      },
      achievements:
        "Certified Cycling Instructor, First Aid Certified, Led 150+ group rides, Completed Paris-Brest-Paris",
      contactInfo: {
        phone: "+61 412 345 678",
        emergencyContact: "Sarah Thompson - +61 423 456 789",
      },
      certifications: [
        { name: "Cycling Australia Level 2 Coach", date: "2023-01-15", expiry: "2025-01-15" },
        { name: "First Aid & CPR", date: "2023-06-20", expiry: "2024-06-20" },
        { name: "Group Ride Leader Certification", date: "2022-08-10", expiry: "2025-08-10" },
      ],
      assignedRides: [
        {
          id: "ride-1",
          title: "Blue Mountains Challenge",
          date: "2024-01-20",
          time: "06:00",
          role: "Lead Captain",
          paceGroup: "Advanced",
          participants: 12,
          status: "Confirmed",
        },
        {
          id: "ride-2",
          title: "Harbour Bridge Loop",
          date: "2024-01-27",
          time: "07:00",
          role: "Safety Captain",
          paceGroup: "Intermediate",
          participants: 18,
          status: "Confirmed",
        },
        {
          id: "ride-3",
          title: "Royal National Park Explorer",
          date: "2024-02-03",
          time: "06:30",
          role: "Lead Captain",
          paceGroup: "Advanced",
          participants: 8,
          status: "Planning",
        },
      ],
      responsibilities: [
        "Lead and coordinate ride groups of 15+ cyclists",
        "Ensure safety protocols are followed during all rides",
        "Mentor and train new ride leaders",
        "Plan and scout new cycling routes",
        "Manage ride logistics and participant communication",
        "Handle emergency situations and first aid when needed",
      ],
      performanceMetrics: {
        ridesLed: 87,
        safetyIncidents: 0,
        participantRating: 4.9,
        mentorshipHours: 45,
      },
    },
    {
      id: "3",
      name: "Emma Wilson",
      email: "emma@example.com",
      role: "Ride Leader",
      bio: "Experienced cyclist with 10+ years of group ride leadership",
      specialties: ["Hill Climbing", "Endurance Training"],
      avatar: "/placeholder.svg",
      joinedDate: "2023-11-10",
      cyclingStats: {
        totalDistance: "15,000",
        avgSpeed: "28",
        longestRide: "200",
        yearsExperience: "10",
      },
      achievements: "Completed 3 Gran Fondos, Local hill climb champion 2023",
      assignedRides: [],
      responsibilities: ["Lead intermediate pace groups", "Assist with ride safety", "Support new members"],
      performanceMetrics: {
        ridesLed: 45,
        safetyIncidents: 0,
        participantRating: 4.7,
        mentorshipHours: 20,
      },
    },
  ])

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedProfileLeader, setSelectedProfileLeader] = useState<any>(null)

  const adminClubs = getAdminClubs()

  const currentClub = adminClubs?.find((club) => club.clubId === selectedClub)

  const [showRideModal, setShowRideModal] = useState(false)
  const [isEditingRide, setIsEditingRide] = useState(false)
  const [editingRide, setEditingRide] = useState<any>(null)
  const [rides, setRides] = useState<any[]>([])
  const [newRideData, setNewRideData] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    meetingPoint: "",
    distance: "",
    elevation: "",
    difficulty: "Easy",
    maxParticipants: 20,
    leaderId: "",
    stravaFile: null,
    stops: [],
    paceGroups: [
      {
        name: "Relaxed",
        avgSpeed: "20-25 km/h",
        description: "Social pace with frequent stops",
        maxParticipants: 8,
        estimatedTime: "",
      },
      {
        name: "Moderate",
        avgSpeed: "25-30 km/h",
        description: "Steady pace with occasional stops",
        maxParticipants: 10,
        estimatedTime: "",
      },
      {
        name: "Fast",
        avgSpeed: "30+ km/h",
        description: "Competitive pace with minimal stops",
        maxParticipants: 6,
        estimatedTime: "",
      },
    ],
    selectedPaceGroups: ["Relaxed", "Moderate", "Fast"],
  })

  const mockCafes = [
    { id: "1", name: "The Grounds of Alexandria", location: "Alexandria" },
    { id: "2", name: "Celsius Coffee", location: "Circular Quay" },
    { id: "3", name: "Pilu Kiosk", location: "Freshwater Beach" },
    { id: "4", name: "Barefoot Coffee Traders", location: "Bondi Beach" },
    { id: "5", name: "Single O", location: "Surry Hills" },
    { id: "6", name: "Toby's Estate", location: "Chippendale" },
    { id: "7", name: "Pablo & Rusty's", location: "Lane Cove" },
    { id: "8", name: "Campos Coffee", location: "Newtown" },
  ]

  const mockClubData = {
    profile: {
      name: currentClub?.clubName || "Eastern Suburbs Cycling Club",
      description: "Perfect balance of fitness and fun with scenic coastal routes and welcoming atmosphere.",
      area: "Eastern Suburbs",
      focus: "Fitness & Social",
      established: "1992",
      membershipFee: "$90/year",
      profileImage: "/eastern-suburbs-cycling-club-coastal.png",
      kitColors: ["Green", "White", "Black"],
      guidelines: [
        "Always wear a helmet",
        "Follow traffic rules",
        "Stay with the group",
        "Communicate hazards",
        "Respect other road users",
      ],
      coffeeStops: ["The Grounds Alexandria", "Celsius Coffee", "Pilu Kiosk"],
      history: "Founded in 1992, our club has grown from a small group of friends to a thriving community of cyclists.",
    },
    members: [
      {
        id: "1",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        role: "member",
        joinedDate: "2024-01-15",
        status: "active",
      },
      {
        id: "2",
        name: "Mike Chen",
        email: "mike@example.com",
        role: "member",
        joinedDate: "2024-02-20",
        status: "active",
      },
      {
        id: "3",
        name: "Emma Wilson",
        email: "emma@example.com",
        role: "leader",
        joinedDate: "2023-11-10",
        status: "active",
      },
    ],
    applications: [
      {
        id: "app-1",
        name: "Alex Thompson",
        email: "alex@example.com",
        experience: "Intermediate",
        motivation: "Looking to join group rides and improve my cycling skills",
        availability: ["Saturday Morning", "Sunday Morning"],
        applicationDate: "2024-12-15",
        status: "pending",
      },
      {
        id: "app-2",
        name: "Lisa Park",
        email: "lisa@example.com",
        experience: "Beginner",
        motivation: "New to cycling and want to learn from experienced riders",
        availability: ["Sunday Morning", "Weekday Evenings"],
        applicationDate: "2024-12-14",
        status: "pending",
      },
    ],
    rides: [
      {
        id: "ride-1",
        name: "Coastal Loop",
        date: "2024-12-22",
        time: "7:00 AM",
        meetingPoint: "Bondi Beach",
        distance: "45km",
        difficulty: "Moderate",
        description: "Scenic coastal ride with coffee stop",
        leaderId: "3",
        maxParticipants: 15,
        currentParticipants: ["1", "2", "4", "5"],
      },
      {
        id: "ride-2",
        name: "Hills Challenge",
        date: "2024-12-24",
        time: "6:30 AM",
        meetingPoint: "Centennial Park",
        distance: "60km",
        difficulty: "Hard",
        description: "Challenging hill climb training",
        leaderId: "3",
        maxParticipants: 12,
        currentParticipants: ["1", "6", "7"],
      },
    ],
  }

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    if (adminClubs.length === 0) {
      router.push("/my-clubs")
      return
    }

    if (!selectedClub && adminClubs.length > 0) {
      setSelectedClub(adminClubs[0].clubId)
      setRides(mockClubData.rides)
    }
  }, [user, adminClubs, selectedClub, router])

  const handleAddLeader = () => {
    console.log("[v0] Adding new leader:", newLeaderData)

    const newLeader = {
      id: `leader-${Date.now()}`,
      name: newLeaderData.name,
      email: newLeaderData.email,
      role: "Ride Leader",
      bio: newLeaderData.bio,
      specialties: newLeaderData.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
      avatar: newLeaderData.profileImage || "/placeholder.svg",
      joinedDate: new Date().toISOString().split("T")[0],
      cyclingStats: newLeaderData.cyclingStats,
      achievements: newLeaderData.achievements,
    }

    setLeaders((prev) => [newLeader, ...prev])

    setNewLeaderData({
      name: "",
      email: "",
      bio: "",
      specialties: "",
      experience: "",
      achievements: "",
      profileImage: "",
      cyclingStats: {
        totalDistance: "",
        avgSpeed: "",
        longestRide: "",
        yearsExperience: "",
      },
    })
    setShowAddLeaderModal(false)

    alert("Ride leader created successfully!")
  }

  const handlePromoteLeader = () => {
    if (!selectedLeader || !promotionRole) return

    setLeaders((prev) =>
      prev.map((leader) => (leader.id === selectedLeader.id ? { ...leader, role: promotionRole } : leader)),
    )

    setShowPromoteDialog(false)
    setSelectedLeader(null)
    setPromotionRole("")
    alert(`${selectedLeader.name} has been promoted to ${promotionRole}!`)
  }

  const handleDeleteLeader = () => {
    if (!selectedLeader) return

    setLeaders((prev) => prev.filter((leader) => leader.id !== selectedLeader.id))

    setShowDeleteDialog(false)
    setSelectedLeader(null)
    alert(`${selectedLeader.name} has been removed from the leadership team.`)
  }

  const getPromotionOptions = (currentRole: string) => {
    switch (currentRole) {
      case "Ride Leader":
        return ["Ride Captain"]
      case "Ride Captain":
        return ["Captain", "Co-Founder"]
      case "Captain":
        return ["Co-Founder"]
      default:
        return []
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setNewLeaderData((prev) => ({ ...prev, profileImage: imageUrl }))
    }
  }

  const handleCreateNewRide = () => {
    setIsEditingRide(false)
    setEditingRide(null)
    setNewRideData({
      name: "",
      description: "",
      date: "",
      time: "",
      meetingPoint: "",
      distance: "",
      elevation: "",
      stravaFile: null,
      maxParticipants: 20,
      captainId: "", // Changed from leaderId to captainId
      paceGroups: [
        {
          name: "Relaxed",
          avgSpeed: "20-25 km/h",
          description: "Perfect for beginners and social rides",
          maxParticipants: 8,
          estimatedTime: "",
          leadRider: "", // Added Lead Rider assignment
          backMarker: "", // Added Back Marker assignment
        },
        {
          name: "Moderate",
          avgSpeed: "25-30 km/h",
          description: "Steady pace for regular cyclists",
          maxParticipants: 10,
          estimatedTime: "",
          leadRider: "",
          backMarker: "",
        },
        {
          name: "Fast",
          avgSpeed: "30+ km/h",
          description: "Challenging pace for experienced riders",
          maxParticipants: 6,
          estimatedTime: "",
          leadRider: "",
          backMarker: "",
        },
      ],
      selectedPaceGroups: [],
      stops: [],
    })
    setShowRideModal(true)
  }

  const canEditRide = (ride: any) => {
    const currentUser = user // Assuming user context is available
    const isAdmin = currentUser?.role === "admin" || currentUser?.role === "founder"
    const isRideCaptain = ride.captainId === currentUser?.id
    return isAdmin || isRideCaptain
  }

  const handleEditRide = (ride: any) => {
    setIsEditingRide(true)
    setEditingRide(ride)
    setNewRideData({
      name: ride.name,
      description: ride.description,
      date: ride.date,
      time: ride.time,
      meetingPoint: ride.meetingPoint,
      distance: ride.distance,
      difficulty: ride.difficulty,
      elevation: ride.elevation || "",
      maxParticipants: ride.maxParticipants,
      leaderId: ride.leaderId,
      stravaFile: null,
      stops: ride.stops || [],
      paceGroups: ride.paceGroups || [
        {
          name: "Relaxed",
          avgSpeed: "20-25 km/h",
          description: "Social pace with frequent stops",
          maxParticipants: 8,
          estimatedTime: "",
        },
        {
          name: "Moderate",
          avgSpeed: "25-30 km/h",
          description: "Steady pace with occasional stops",
          maxParticipants: 8,
          estimatedTime: "",
        },
        {
          name: "Fast",
          avgSpeed: "30+ km/h",
          description: "Competitive pace with minimal stops",
          maxParticipants: 6,
          estimatedTime: "",
        },
      ],
      selectedPaceGroups: ride.selectedPaceGroups || ["Relaxed", "Moderate", "Fast"],
    })
    setShowRideModal(true)
  }

  const handleCancelRide = (rideId: string) => {
    const ride = rides.find((r) => r.id === rideId)
    if (
      ride &&
      confirm(`Are you sure you want to cancel "${ride.name}"? This will notify all participants and the ride leader.`)
    ) {
      const updatedRides = rides.map((r) => (r.id === rideId ? { ...r, status: "cancelled" } : r))
      setRides(updatedRides)
      alert(
        `Ride cancelled. Notifications sent to ${ride.currentParticipants.length} participants and the ride leader.`,
      )
    }
  }

  const validateRideForm = () => {
    const requiredFields = [
      newRideData.name,
      newRideData.description,
      newRideData.date,
      newRideData.time,
      newRideData.distance,
      newRideData.elevation,
      newRideData.meetingPoint,
      newRideData.captainId, // Fixed validation to use captainId instead of leaderId
    ]

    // Check if all required fields are filled
    const allFieldsFilled = requiredFields.every((field) => field && field.toString().trim() !== "")

    // Check if at least one pace group is selected
    const hasPaceGroups = newRideData.selectedPaceGroups && newRideData.selectedPaceGroups.length > 0

    // Check if each selected pace group has both Lead Rider and Back Marker assigned
    const paceGroupsValid = newRideData.selectedPaceGroups?.every((groupName) => {
      const group = newRideData.paceGroups.find((pg) => pg.name === groupName)
      return group && group.leadRider && group.backMarker && group.estimatedTime
    })

    return allFieldsFilled && hasPaceGroups && paceGroupsValid
  }

  const handleCreateRide = () => {
    if (!validateRideForm()) {
      alert("Please fill in all required fields and assign leaders to pace groups.")
      return
    }

    const selectedCaptain = leaders?.find((leader) => leader.id === newRideData.captainId)

    const newRide = {
      id: Date.now().toString(),
      name: newRideData.name,
      description: newRideData.description,
      date: newRideData.date,
      time: newRideData.time,
      meetingPoint: newRideData.meetingPoint,
      distance: newRideData.distance,
      elevation: newRideData.elevation,
      difficulty: newRideData.difficulty,
      maxParticipants: newRideData.maxParticipants,
      captainId: newRideData.captainId, // Fixed to use captainId instead of leaderId
      captainName: selectedCaptain?.name || "Unknown",
      paceGroups: newRideData.paceGroups.filter((pg) => newRideData.selectedPaceGroups.includes(pg.name)),
      stops: newRideData.stops || [],
      currentParticipants: [],
      status: "upcoming",
      createdAt: new Date().toISOString(),
    }

    try {
      setRides([...rides, newRide])
      setShowRideModal(false)

      setNewRideData({
        name: "",
        description: "",
        date: "",
        time: "",
        meetingPoint: "",
        distance: "",
        elevation: "",
        difficulty: "Easy",
        maxParticipants: 20,
        captainId: "", // Fixed field name consistency
        stravaFile: null,
        stops: [],
        paceGroups: [
          {
            name: "Relaxed",
            avgSpeed: "20-25 km/h",
            description: "Social pace with frequent stops",
            maxParticipants: 8,
            estimatedTime: "",
            leadRider: "",
            backMarker: "",
          },
          {
            name: "Moderate",
            avgSpeed: "25-30 km/h",
            description: "Steady pace with frequent stops",
            maxParticipants: 10,
            estimatedTime: "",
            leadRider: "",
            backMarker: "",
          },
          {
            name: "Fast",
            avgSpeed: "30+ km/h",
            description: "Competitive pace with minimal stops",
            maxParticipants: 6,
            estimatedTime: "",
            leadRider: "",
            backMarker: "",
          },
        ],
        selectedPaceGroups: ["Relaxed", "Moderate", "Fast"],
      })

      alert(
        `Ride "${newRide.name}" created successfully!\n\nDetails:\n• Date: ${newRide.date} at ${newRide.time}\n• Captain: ${selectedCaptain?.name || "Unknown"}\n• Distance: ${newRide.distance}\n• Pace Groups: ${newRide.paceGroups.length}\n\nThe ride has been added to your ride management section and relevant users will be notified.`,
      )
    } catch (error) {
      console.error("[v0] Error creating ride:", error)
      alert("Error creating ride. Please try again.")
    }
  }

  const handleUpdateRide = () => {
    const updatedRides = rides.map((ride) =>
      ride.id === editingRide.id
        ? {
            ...ride,
            name: newRideData.name,
            description: newRideData.description,
            date: newRideData.date,
            time: newRideData.time,
            meetingPoint: newRideData.meetingPoint,
            distance: newRideData.distance,
            difficulty: newRideData.difficulty,
            maxParticipants: newRideData.maxParticipants,
            leaderId: newRideData.leaderId,
            paceGroups: newRideData.selectedPaceGroups,
          }
        : ride,
    )

    setRides(updatedRides)
    setShowRideModal(false)
    setEditingRide(null)
    alert("Ride updated successfully!")
  }

  const handleViewProfile = (leader: any) => {
    setSelectedProfileLeader(leader)
    setShowProfileModal(true)
  }

  if (!user || (adminClubs?.length || 0) === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              Club Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your cycling clubs and engage with your community</p>
          </div>

          {adminClubs.length > 1 && (
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a club" />
              </SelectTrigger>
              <SelectContent>
                {adminClubs.map((club) => (
                  <SelectItem key={club.clubId} value={club.clubId}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {club.role}
                      </Badge>
                      {club.clubName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {currentClub && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{currentClub.clubName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge className="bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      {currentClub.role}
                    </Badge>
                    <span>Member since {new Date(currentClub.joinedDate).toLocaleDateString()}</span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{mockClubData?.members?.length || 0}</div>
                  <div className="text-sm text-gray-600">Active Members</div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="rides" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rides
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Club Profile
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messaging
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockClubData?.members?.length || 0}</div>
                  <p className="text-xs text-green-600">+2 this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockClubData?.applications?.length || 0}</div>
                  <p className="text-xs text-orange-600">Requires review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Upcoming Rides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockClubData?.rides?.length || 0}</div>
                  <p className="text-xs text-blue-600">Next 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Leaders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leaders?.length || 0}</div>
                  <p className="text-xs text-gray-600">Ride leaders</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">New member joined</p>
                      <p className="text-sm text-gray-600">Sarah Johnson joined the club</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">New application received</p>
                      <p className="text-sm text-gray-600">Alex Thompson applied to join</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">1 day ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Ride created</p>
                      <p className="text-sm text-gray-600">Coastal Loop ride scheduled for Dec 22</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">2 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rides" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Ride Management</h2>
              <Button className="flex items-center gap-2" onClick={handleCreateNewRide}>
                <Plus className="h-4 w-4" />
                Create New Ride
              </Button>
            </div>

            <div className="grid gap-6">
              {rides.map((ride) => (
                <Card key={ride.id} className={ride.status === "cancelled" ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {ride.name}
                          {ride.status === "cancelled" && <Badge className="bg-red-100 text-red-800">Cancelled</Badge>}
                          <Badge
                            className={
                              ride.difficulty === "Easy"
                                ? "bg-green-100 text-green-800"
                                : ride.difficulty === "Moderate"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {ride.difficulty}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(ride.date).toLocaleDateString()} at {ride.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {ride.meetingPoint}
                          </span>
                          <span>{ride.distance}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">
                          <strong>Captain:</strong> {leaders?.find((l) => l.id === ride.captainId)?.name || "Unknown"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRide(ride)}
                          disabled={ride.status === "cancelled" || !canEditRide(ride)} // Added role-based permission check
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRide(ride.id)}
                          disabled={ride.status === "cancelled" || !canEditRide(ride)} // Added role-based permission check
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{ride.description}</p>
                    {ride.paceGroups && ride.paceGroups.length > 0 && (
                      <div className="mb-4">
                        <span className="text-sm font-medium">Pace Groups & Leaders: </span>
                        <div className="space-y-2 mt-2">
                          {ride.paceGroups
                            .filter((group) => ride.selectedPaceGroups?.includes(group.name))
                            .map((group, idx) => (
                              <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                                <div className="flex justify-between items-center mb-2">
                                  <Badge variant="outline" className="text-xs font-medium">
                                    {group.name} - {group.avgSpeed}
                                  </Badge>
                                  <span className="text-xs text-gray-600">Max: {group.maxParticipants}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium text-green-700">Lead Rider:</span>
                                    <div>{leaders?.find((l) => l.id === group.leadRider)?.name || "Not assigned"}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-700">Back Marker:</span>
                                    <div>{leaders?.find((l) => l.id === group.backMarker)?.name || "Not assigned"}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-sm">
                          <strong>Participants:</strong> {ride.currentParticipants?.length || 0}/{ride.maxParticipants}
                        </span>
                      </div>
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Member Management</h2>
              <Button className="flex items-center gap-2" onClick={() => setShowAddLeaderModal(true)}>
                <Plus className="h-4 w-4" />
                Add Leader
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Recent Ride Leaders
                </CardTitle>
                <CardDescription>Recently added ride leaders and their profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leaders.map((leader) => (
                    <div key={leader.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                          <Image
                            src={leader.avatar || "/placeholder.svg"}
                            alt={leader.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{leader.name}</h4>
                          <Badge className="bg-blue-100 text-blue-800 text-xs">{leader.role}</Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          {/* Adding comprehensive profile view functionality */}
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProfile(leader)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            {getPromotionOptions(leader.role).length > 0 && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedLeader(leader)
                                  setShowPromoteDialog(true)
                                }}
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Promote
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLeader(leader)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">{leader.bio}</p>
                        <div className="flex flex-wrap gap-1">
                          {leader.specialties.map((specialty, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Experience:</span>
                          <div>{leader.cyclingStats.yearsExperience}+ years</div>
                        </div>
                        <div>
                          <span className="font-medium">Rides Led:</span>
                          <div>45 rides</div>
                        </div>
                        <div>
                          <span className="font-medium">Avg Speed:</span>
                          <div>{leader.cyclingStats.avgSpeed} km/h</div>
                        </div>
                        <div>
                          <span className="font-medium">Total Distance:</span>
                          <div>{leader.cyclingStats.totalDistance} km</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Joined {new Date(leader.joinedDate).toLocaleDateString()}</span>
                        <Button size="sm" variant="outline" className="h-7 px-2 bg-transparent">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}

                  {leaders.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No ride leaders added yet</p>
                      <p className="text-sm">Click "Add Leader" to create the first leader profile</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {(mockClubData?.applications?.length || 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Pending Applications ({mockClubData?.applications?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(mockClubData?.applications || []).map((app) => (
                      <div key={app.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{app.name}</h4>
                            <p className="text-sm text-gray-600">{app.email}</p>
                            <p className="text-xs text-gray-500">Applied {app.applicationDate}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Experience:</strong> {app.experience}
                          </div>
                          <div>
                            <strong>Availability:</strong> {app.availability.join(", ")}
                          </div>
                          <div>
                            <strong>Motivation:</strong> {app.motivation.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Current Members ({mockClubData?.members?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(mockClubData?.members || []).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            member.role === "leader" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          }
                        >
                          {member.role}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Joined {new Date(member.joinedDate).toLocaleDateString()}
                        </span>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Club Profile</h2>
              <Button>Save Changes</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="club-name">Club Name</Label>
                    <Input id="club-name" defaultValue={mockClubData.profile.name} />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" defaultValue={mockClubData.profile.description} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="area">Area</Label>
                      <Input id="area" defaultValue={mockClubData.profile.area} />
                    </div>
                    <div>
                      <Label htmlFor="focus">Focus</Label>
                      <Input id="focus" defaultValue={mockClubData.profile.focus} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="established">Established</Label>
                      <Input id="established" defaultValue={mockClubData.profile.established} />
                    </div>
                    <div>
                      <Label htmlFor="membership-fee">Membership Fee</Label>
                      <Input id="membership-fee" defaultValue={mockClubData.profile.membershipFee} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profile Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative h-48 w-full bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={mockClubData.profile.profileImage || "/placeholder.svg"}
                        alt="Club profile"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button className="w-full flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload New Image
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Club Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockClubData.profile.guidelines.map((guideline, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Input defaultValue={guideline} />
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Add Guideline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messaging" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Club Messaging</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Send Notification to Members</CardTitle>
                <CardDescription>Send updates about rides, events, or general club information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message-type">Message Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select message type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ride_update">Ride Update</SelectItem>
                      <SelectItem value="general">General Announcement</SelectItem>
                      <SelectItem value="cancellation">Ride Cancellation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message-subject">Subject</Label>
                  <Input id="message-subject" placeholder="Enter message subject" />
                </div>
                <div>
                  <Label htmlFor="message-content">Message</Label>
                  <Textarea id="message-content" placeholder="Enter your message..." rows={5} />
                </div>
                <Button className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send to All Members
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-medium">Weekend Ride Update</h4>
                    <p className="text-sm text-gray-600">Meeting point changed to Bondi Beach</p>
                    <p className="text-xs text-gray-500">Sent 2 days ago to 15 members</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-medium">New Coffee Stop Added</h4>
                    <p className="text-sm text-gray-600">Check out our new partner café in Coogee</p>
                    <p className="text-xs text-gray-500">Sent 1 week ago to 15 members</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4 py-2">
                    <h4 className="font-medium">Ride Cancelled</h4>
                    <p className="text-sm text-gray-600">Sunday ride cancelled due to weather</p>
                    <p className="text-xs text-gray-500">Sent 2 weeks ago to 12 members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showAddLeaderModal} onOpenChange={setShowAddLeaderModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Ride Leader</DialogTitle>
              <DialogDescription>
                Create a profile for a new ride leader with their details, bio, and cycling statistics.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 bg-gray-100 rounded-full overflow-hidden">
                    {newLeaderData.profileImage ? (
                      <Image
                        src={newLeaderData.profileImage || "/placeholder.svg"}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-upload"
                    />
                    <Label htmlFor="profile-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" className="flex items-center gap-2 bg-transparent">
                        <Upload className="h-4 w-4" />
                        Upload Photo
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leader-name">Full Name *</Label>
                  <Input
                    id="leader-name"
                    value={newLeaderData.name}
                    onChange={(e) => setNewLeaderData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="leader-email">Email Address *</Label>
                  <Input
                    id="leader-email"
                    type="email"
                    value={newLeaderData.email}
                    onChange={(e) => setNewLeaderData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="leader-bio">Bio *</Label>
                <Textarea
                  id="leader-bio"
                  value={newLeaderData.bio}
                  onChange={(e) => setNewLeaderData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about this leader's background and cycling experience..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialties">Specialties</Label>
                  <Input
                    id="specialties"
                    value={newLeaderData.specialties}
                    onChange={(e) => setNewLeaderData((prev) => ({ ...prev, specialties: e.target.value }))}
                    placeholder="e.g., Hill Climbing, Endurance Training"
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select
                    value={newLeaderData.experience}
                    onValueChange={(value) => setNewLeaderData((prev) => ({ ...prev, experience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intermediate">Intermediate Leader</SelectItem>
                      <SelectItem value="advanced">Advanced Leader</SelectItem>
                      <SelectItem value="expert">Expert Leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Cycling Statistics</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label htmlFor="total-distance">Total Distance (km)</Label>
                    <Input
                      id="total-distance"
                      value={newLeaderData.cyclingStats.totalDistance}
                      onChange={(e) =>
                        setNewLeaderData((prev) => ({
                          ...prev,
                          cyclingStats: { ...prev.cyclingStats, totalDistance: e.target.value },
                        }))
                      }
                      placeholder="e.g., 15,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="avg-speed">Average Speed (km/h)</Label>
                    <Input
                      id="avg-speed"
                      value={newLeaderData.cyclingStats.avgSpeed}
                      onChange={(e) =>
                        setNewLeaderData((prev) => ({
                          ...prev,
                          cyclingStats: { ...prev.cyclingStats, avgSpeed: e.target.value },
                        }))
                      }
                      placeholder="e.g., 28"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longest-ride">Longest Ride (km)</Label>
                    <Input
                      id="longest-ride"
                      value={newLeaderData.cyclingStats.longestRide}
                      onChange={(e) =>
                        setNewLeaderData((prev) => ({
                          ...prev,
                          cyclingStats: { ...prev.cyclingStats, longestRide: e.target.value },
                        }))
                      }
                      placeholder="e.g., 200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="years-experience">Years of Experience</Label>
                    <Input
                      id="years-experience"
                      value={newLeaderData.cyclingStats.yearsExperience}
                      onChange={(e) =>
                        setNewLeaderData((prev) => ({
                          ...prev,
                          cyclingStats: { ...prev.cyclingStats, yearsExperience: e.target.value },
                        }))
                      }
                      placeholder="e.g., 8"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="achievements">Notable Achievements</Label>
                <Textarea
                  id="achievements"
                  value={newLeaderData.achievements}
                  onChange={(e) => setNewLeaderData((prev) => ({ ...prev, achievements: e.target.value }))}
                  placeholder="List any cycling achievements, certifications, or notable accomplishments..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddLeaderModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddLeader}
                disabled={!newLeaderData.name || !newLeaderData.email || !newLeaderData.bio}
              >
                Add Leader
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promote Ride Leader</DialogTitle>
              <DialogDescription>
                Select the new role for {selectedLeader?.name}. This action will update their permissions and
                responsibilities.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                    <Image
                      src={selectedLeader?.avatar || "/placeholder.svg"}
                      alt={selectedLeader?.name || "Leader"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedLeader?.name}</p>
                    <p className="text-sm text-gray-600">Current role: {selectedLeader?.role}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label>New Role</Label>
                <Select value={promotionRole} onValueChange={setPromotionRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPromotionOptions(selectedLeader?.role || "").map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p className="font-medium mb-1">Role Responsibilities:</p>
                {promotionRole === "Ride Captain" && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Lead and manage ride groups</li>
                    <li>Oversee ride safety and coordination</li>
                    <li>Mentor new ride leaders</li>
                    <li>Edit and cancel rides when necessary</li>
                  </ul>
                )}
                {promotionRole === "Captain" && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Lead multiple ride groups</li>
                    <li>Mentor new ride leaders</li>
                    <li>Coordinate club events</li>
                  </ul>
                )}
                {promotionRole === "Co-Founder" && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Full club administration access</li>
                    <li>Manage club policies and procedures</li>
                    <li>Oversee all club operations</li>
                  </ul>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPromoteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePromoteLeader} disabled={!promotionRole} className="bg-blue-600 hover:bg-blue-700">
                Confirm Promotion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Ride Leader</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedLeader?.name} from the leadership team? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                    <Image
                      src={selectedLeader?.avatar || "/placeholder.svg"}
                      alt={selectedLeader?.name || "Leader"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedLeader?.name}</p>
                    <p className="text-sm text-gray-600">{selectedLeader?.role}</p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                <p className="font-medium mb-1">⚠️ Warning:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This leader will lose all administrative privileges</li>
                  <li>Any scheduled rides they're leading will need reassignment</li>
                  <li>Their profile and statistics will be permanently removed</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeleteLeader} variant="destructive">
                Remove Leader
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showRideModal} onOpenChange={setShowRideModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditingRide ? "Edit Ride" : "Create New Ride"}</DialogTitle>
              <DialogDescription>
                {isEditingRide
                  ? "Update ride details and settings for your club members."
                  : "Set up a new ride for your club members with leader assignment and pace groups."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="rideName">Ride Name</Label>
                <Input
                  id="rideName"
                  value={newRideData.name}
                  onChange={(e) => setNewRideData({ ...newRideData, name: e.target.value })}
                  placeholder="e.g., Morning Hills Challenge"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={newRideData.description}
                  onChange={(e) => setNewRideData({ ...newRideData, description: e.target.value })}
                  placeholder="Describe the ride route, highlights, and what to expect..."
                  className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md resize-none"
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={newRideData.difficulty}
                  onChange={(value) => setNewRideData({ ...newRideData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newRideData.date}
                    onChange={(e) => setNewRideData({ ...newRideData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newRideData.time}
                    onChange={(e) => setNewRideData({ ...newRideData, time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="distance">Distance</Label>
                  <Input
                    id="distance"
                    value={newRideData.distance}
                    onChange={(e) => setNewRideData({ ...newRideData, distance: e.target.value })}
                    placeholder="e.g., 45km"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="elevation">Elevation Gain</Label>
                  <Input
                    id="elevation"
                    value={newRideData.elevation}
                    onChange={(e) => setNewRideData({ ...newRideData, elevation: e.target.value })}
                    placeholder="e.g., 850m"
                  />
                </div>
                <div>
                  <Label htmlFor="meetingPoint">Meeting Point</Label>
                  <Input
                    id="meetingPoint"
                    value={newRideData.meetingPoint}
                    onChange={(e) => setNewRideData({ ...newRideData, meetingPoint: e.target.value })}
                    placeholder="e.g., Hyde Park Fountain"
                  />
                </div>
              </div>

              {!isEditingRide && (
                <div>
                  <Label htmlFor="stravaFile">Import Route from Strava</Label>
                  <div className="mt-2">
                    <Input
                      id="stravaFile"
                      type="file"
                      accept=".gpx,.tcx,.fit"
                      onChange={(e) => setNewRideData({ ...newRideData, stravaFile: e.target.files?.[0] || null })}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                    <p className="text-sm text-gray-500 mt-1">Upload GPX, TCX, or FIT files from Strava (optional)</p>
                  </div>
                </div>
              )}

              <div>
                <Label>Planned Stops</Label>
                <div className="mt-2 space-y-2">
                  <Select
                    onValueChange={(value) => {
                      const selectedCafe = mockCafes.find((cafe) => cafe.id === value)
                      if (selectedCafe && !newRideData.stops.find((stop) => stop.id === selectedCafe.id)) {
                        setNewRideData({
                          ...newRideData,
                          stops: [...newRideData.stops, selectedCafe],
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add a coffee stop or point of interest" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCafes.map((cafe) => (
                        <SelectItem key={cafe.id} value={cafe.id}>
                          {cafe.name} - {cafe.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(newRideData?.stops?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(newRideData?.stops || []).map((stop, index) => (
                        <div
                          key={stop.id}
                          className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm"
                        >
                          <MapPin className="h-3 w-3" />
                          {stop.name}
                          <button
                            type="button"
                            onClick={() =>
                              setNewRideData({
                                ...newRideData,
                                stops: newRideData.stops.filter((_, i) => i !== index),
                              })
                            }
                            className="ml-1 text-gray-500 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="maxParticipants">Overall Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={newRideData.maxParticipants}
                  onChange={(e) => setNewRideData({ ...newRideData, maxParticipants: Number.parseInt(e.target.value) })}
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <Label htmlFor="captain">Ride Captain</Label>
                <Select
                  value={newRideData.captainId}
                  onValueChange={(value) => {
                    setNewRideData({ ...newRideData, captainId: value })
                    const selectedCaptain = leaders?.find((leader) => leader.id === value)
                    if (selectedCaptain) {
                      console.log("[v0] Selected captain:", selectedCaptain.name, selectedCaptain.role)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a ride captain" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaders
                      ?.filter(
                        (leader) =>
                          leader.role === "Captain" || leader.role === "Co-Founder" || leader.role === "Ride Captain",
                      )
                      .map((leader) => (
                        <SelectItem key={leader.id} value={leader.id}>
                          <div className="flex items-center gap-3 py-2 w-full">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={leader.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {leader.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{leader.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {leader.role}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  {leader.experience || "5+ years"}
                                </span>
                                {leader.certifications && leader.certifications.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    {leader.certifications[0]?.name || "Certified"}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {leader.ridesLed || 0} rides led
                                </span>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {newRideData.captainId && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    {(() => {
                      const selectedCaptain = leaders?.find((leader) => leader.id === newRideData.captainId)
                      return selectedCaptain ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedCaptain.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {selectedCaptain.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-blue-900">
                              {selectedCaptain.name} selected as Ride Captain
                            </p>
                            <p className="text-xs text-blue-700">
                              {selectedCaptain.experience || "5+ years"} experience •{selectedCaptain.ridesLed || 0}{" "}
                              rides led •{selectedCaptain.certifications?.length || 0} certifications
                            </p>
                          </div>
                        </div>
                      ) : null
                    })()}
                  </div>
                )}
              </div>

              <div>
                <Label>Pace Groups & Leader Assignments</Label>
                <div className="space-y-4 mt-2">
                  {newRideData.paceGroups.map((group, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`pace-${index}`}
                          checked={newRideData.selectedPaceGroups.includes(group.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewRideData({
                                ...newRideData,
                                selectedPaceGroups: [...newRideData.selectedPaceGroups, group.name],
                              })
                            } else {
                              setNewRideData({
                                ...newRideData,
                                selectedPaceGroups: newRideData.selectedPaceGroups.filter((g) => g !== group.name),
                              })
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`pace-${index}`} className="font-medium">
                            {group.name} ({group.avgSpeed})
                          </Label>
                          <p className="text-sm text-gray-600">{group.description}</p>
                        </div>
                      </div>

                      {newRideData.selectedPaceGroups.includes(group.name) && (
                        <div className="space-y-3 ml-6">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`maxParticipants-${index}`} className="text-sm">
                                Max Participants
                              </Label>
                              <Input
                                id={`maxParticipants-${index}`}
                                type="number"
                                value={group.maxParticipants}
                                onChange={(e) => {
                                  const updatedGroups = [...newRideData.paceGroups]
                                  updatedGroups[index].maxParticipants = Number.parseInt(e.target.value)
                                  setNewRideData({ ...newRideData, paceGroups: updatedGroups })
                                }}
                                min="1"
                                max="20"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`estimatedTime-${index}`} className="text-sm">
                                Estimated Time
                              </Label>
                              <Input
                                id={`estimatedTime-${index}`}
                                type="text"
                                placeholder="e.g., 2.5 hours"
                                value={group.estimatedTime}
                                onChange={(e) => {
                                  const updatedGroups = [...newRideData.paceGroups]
                                  updatedGroups[index].estimatedTime = e.target.value
                                  setNewRideData({ ...newRideData, paceGroups: updatedGroups })
                                }}
                                className="h-8"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium text-green-700">Lead Rider</Label>
                              <Select
                                value={group.leadRider}
                                onValueChange={(value) => {
                                  const updatedGroups = [...newRideData.paceGroups]
                                  updatedGroups[index].leadRider = value
                                  setNewRideData({ ...newRideData, paceGroups: updatedGroups })
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select lead rider" />
                                </SelectTrigger>
                                <SelectContent>
                                  {leaders?.map((leader) => (
                                    <SelectItem key={leader.id} value={leader.id}>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-4 w-4">
                                          <AvatarImage src={leader.avatar || "/placeholder.svg"} />
                                          <AvatarFallback className="text-xs">
                                            {leader.name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{leader.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-blue-700">Back Marker</Label>
                              <Select
                                value={group.backMarker}
                                onValueChange={(value) => {
                                  const updatedGroups = [...newRideData.paceGroups]
                                  updatedGroups[index].backMarker = value
                                  setNewRideData({ ...newRideData, paceGroups: updatedGroups })
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select back marker" />
                                </SelectTrigger>
                                <SelectContent>
                                  {leaders?.map((leader) => (
                                    <SelectItem key={leader.id} value={leader.id}>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-4 w-4">
                                          <AvatarImage src={leader.avatar || "/placeholder.svg"} />
                                          <AvatarFallback className="text-xs">
                                            {leader.name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{leader.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRideModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={isEditingRide ? handleUpdateRide : handleCreateRide}
                disabled={isEditingRide ? false : !validateRideForm()}
                className={`w-full ${!validateRideForm() && !isEditingRide ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isEditingRide ? "Update Ride" : "Create Ride"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adding comprehensive Ride Captain profile modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="relative w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                  <Image
                    src={selectedProfileLeader?.avatar || "/placeholder.svg"}
                    alt={selectedProfileLeader?.name || "Leader"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {selectedProfileLeader?.name}
                    <Badge
                      className={
                        selectedProfileLeader?.role === "Ride Captain"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }
                    >
                      {selectedProfileLeader?.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-normal">{selectedProfileLeader?.email}</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedProfileLeader && (
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm">{selectedProfileLeader.contactInfo?.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Emergency Contact</Label>
                      <p className="text-sm">{selectedProfileLeader.contactInfo?.emergencyContact || "Not provided"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bio and Specialties */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Bio</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedProfileLeader.bio}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Specialties</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedProfileLeader.specialties?.map((specialty: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Achievements</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedProfileLeader.achievements}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Certifications */}
                {selectedProfileLeader.certifications && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedProfileLeader.certifications.map((cert: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{cert.name}</p>
                              <p className="text-xs text-gray-600">
                                Issued: {new Date(cert.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={new Date(cert.expiry) > new Date() ? "default" : "destructive"}
                              className="text-xs"
                            >
                              Expires: {new Date(cert.expiry).toLocaleDateString()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cycling Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Cycling Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedProfileLeader.cyclingStats.totalDistance}
                        </p>
                        <p className="text-sm text-gray-600">Total Distance (km)</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {selectedProfileLeader.cyclingStats.avgSpeed}
                        </p>
                        <p className="text-sm text-gray-600">Avg Speed (km/h)</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {selectedProfileLeader.cyclingStats.longestRide}
                        </p>
                        <p className="text-sm text-gray-600">Longest Ride (km)</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedProfileLeader.cyclingStats.yearsExperience}
                        </p>
                        <p className="text-sm text-gray-600">Years Experience</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                {selectedProfileLeader.performanceMetrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold">{selectedProfileLeader.performanceMetrics.ridesLed}</p>
                          <p className="text-sm text-gray-600">Rides Led</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {selectedProfileLeader.performanceMetrics.safetyIncidents}
                          </p>
                          <p className="text-sm text-gray-600">Safety Incidents</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600">
                            {selectedProfileLeader.performanceMetrics.participantRating}
                          </p>
                          <p className="text-sm text-gray-600">Participant Rating</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold">
                            {selectedProfileLeader.performanceMetrics.mentorshipHours}
                          </p>
                          <p className="text-sm text-gray-600">Mentorship Hours</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Responsibilities */}
                {selectedProfileLeader.responsibilities && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Role Responsibilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedProfileLeader.responsibilities.map((responsibility: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{responsibility}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Assigned Rides */}
                {selectedProfileLeader.assignedRides && selectedProfileLeader.assignedRides.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Assigned Rides
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedProfileLeader.assignedRides.map((ride: any, idx: number) => (
                          <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{ride.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(ride.date).toLocaleDateString()} at {ride.time}
                                </p>
                              </div>
                              <Badge variant={ride.status === "Confirmed" ? "default" : "secondary"}>
                                {ride.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Role:</span>
                                <p className="text-gray-600">{ride.role}</p>
                              </div>
                              <div>
                                <span className="font-medium">Pace Group:</span>
                                <p className="text-gray-600">{ride.paceGroup}</p>
                              </div>
                              <div>
                                <span className="font-medium">Participants:</span>
                                <p className="text-gray-600">{ride.participants} riders</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowProfileModal(false)
                  // Open edit modal for this leader
                  setSelectedLeader(selectedProfileLeader)
                  setShowAddLeaderModal(true)
                }}
              >
                Edit Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  )
}
