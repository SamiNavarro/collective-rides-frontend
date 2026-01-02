"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Ban,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Activity,
  Star,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ClubOversightPage() {
  const { user, isSiteAdmin } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterArea, setFilterArea] = useState("all")
  const [selectedClub, setSelectedClub] = useState<any>(null)

  useEffect(() => {
    if (!user || !isSiteAdmin()) {
      router.push("/hub")
      return
    }
  }, [user, isSiteAdmin, router])

  // Mock club data
  const mockClubs = [
    {
      id: "1",
      name: "Sydney Cycling Club",
      description: "Premier cycling club for Sydney riders of all levels",
      area: "Sydney CBD",
      focus: "Road Cycling",
      established: "2020-01-15",
      status: "active",
      verified: true,
      memberCount: 156,
      activeRides: 12,
      averageRating: 4.8,
      reports: 0,
      admins: ["Marcus Thompson", "Sarah Chen"],
      profileImage: "/clubs/sydney-cycling.jpg",
      lastActivity: "2024-12-18",
    },
    {
      id: "2",
      name: "Eastern Suburbs Cycling Club",
      description: "Exploring the beautiful Eastern Suburbs on two wheels",
      area: "Eastern Suburbs",
      focus: "Recreational",
      established: "2021-03-20",
      status: "active",
      verified: true,
      memberCount: 89,
      activeRides: 8,
      averageRating: 4.6,
      reports: 0,
      admins: ["Emma Wilson"],
      profileImage: "/clubs/eastern-suburbs.jpg",
      lastActivity: "2024-12-17",
    },
    {
      id: "3",
      name: "Northern Beaches Riders",
      description: "Coastal cycling adventures in the Northern Beaches",
      area: "Northern Beaches",
      focus: "Mountain Biking",
      established: "2023-06-10",
      status: "pending",
      verified: false,
      memberCount: 23,
      activeRides: 3,
      averageRating: 4.2,
      reports: 1,
      admins: ["David Park"],
      profileImage: "/clubs/northern-beaches.jpg",
      lastActivity: "2024-12-15",
    },
    {
      id: "4",
      name: "Inner West Riders",
      description: "Community-focused cycling group for Inner West residents",
      area: "Inner West",
      focus: "Community",
      established: "2022-09-05",
      status: "suspended",
      verified: true,
      memberCount: 67,
      activeRides: 0,
      averageRating: 3.9,
      reports: 3,
      admins: ["Lisa Johnson"],
      profileImage: "/clubs/inner-west.jpg",
      lastActivity: "2024-12-01",
    },
  ]

  const filteredClubs = mockClubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || club.status === filterStatus
    const matchesArea = filterArea === "all" || club.area === filterArea
    return matchesSearch && matchesStatus && matchesArea
  })

  const handleClubAction = (clubId: string, action: string) => {
    console.log(`Performing ${action} on club ${clubId}`)
    // In a real app, this would make API calls
  }

  if (!user || !isSiteAdmin()) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Club Oversight</h1>
          <p className="text-muted-foreground">Monitor and manage all cycling clubs on the platform</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockClubs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockClubs.filter((c) => c.status === "active").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockClubs.filter((c) => c.status === "pending").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockClubs.reduce((sum, club) => sum + club.memberCount, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clubs by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="Sydney CBD">Sydney CBD</SelectItem>
                  <SelectItem value="Eastern Suburbs">Eastern Suburbs</SelectItem>
                  <SelectItem value="Northern Beaches">Northern Beaches</SelectItem>
                  <SelectItem value="Inner West">Inner West</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clubs List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clubs ({filteredClubs.length})
            </CardTitle>
            <CardDescription>All cycling clubs on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredClubs.map((club) => (
                <div key={club.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={club.profileImage || "/placeholder.svg"} />
                        <AvatarFallback>
                          {club.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{club.name}</h3>
                          {club.verified && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{club.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge
                            variant={
                              club.status === "active"
                                ? "default"
                                : club.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {club.status}
                          </Badge>
                          <Badge variant="outline">{club.focus}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {club.area}
                          </span>
                          {club.reports > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {club.reports} reports
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {club.memberCount} members
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          {club.activeRides} active rides
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Star className="h-3 w-3" />
                          {club.averageRating} rating
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedClub(club)}>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Club Details: {selectedClub?.name}</DialogTitle>
                            <DialogDescription>Comprehensive club information and management options</DialogDescription>
                          </DialogHeader>
                          {selectedClub && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={selectedClub.profileImage || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {selectedClub.name
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-semibold">{selectedClub.name}</h3>
                                    {selectedClub.verified && <CheckCircle className="h-5 w-5 text-green-600" />}
                                  </div>
                                  <p className="text-muted-foreground">{selectedClub.description}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant={selectedClub.status === "active" ? "default" : "destructive"}>
                                      {selectedClub.status}
                                    </Badge>
                                    <Badge variant="outline">{selectedClub.focus}</Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Club Information</h4>
                                  <div className="text-sm space-y-1">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Area: {selectedClub.area}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Established: {selectedClub.established}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Activity className="h-4 w-4" />
                                      Last activity: {selectedClub.lastActivity}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium">Statistics</h4>
                                  <div className="text-sm space-y-1">
                                    <div>Members: {selectedClub.memberCount}</div>
                                    <div>Active rides: {selectedClub.activeRides}</div>
                                    <div>Rating: {selectedClub.averageRating}/5</div>
                                    <div>Reports: {selectedClub.reports}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-medium">Administrators</h4>
                                <div className="flex gap-2">
                                  {selectedClub.admins.map((admin: string, index: number) => (
                                    <Badge key={index} variant="secondary">
                                      {admin}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {selectedClub.status === "pending" && (
                                  <Button size="sm" onClick={() => handleClubAction(selectedClub.id, "approve")}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Club
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClubAction(selectedClub.id, "verify")}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  {selectedClub.verified ? "Remove Verification" : "Verify Club"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleClubAction(selectedClub.id, "suspend")}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend Club
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {club.status === "pending" && (
                            <DropdownMenuItem onClick={() => handleClubAction(club.id, "approve")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Club
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleClubAction(club.id, "verify")}>
                            <Shield className="h-4 w-4 mr-2" />
                            {club.verified ? "Remove Verification" : "Verify Club"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleClubAction(club.id, "suspend")}
                            className="text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Suspend Club
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
