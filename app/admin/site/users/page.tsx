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
  UserCheck,
  Mail,
  Calendar,
  MapPin,
  Activity,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function UserManagementPage() {
  const { user, isSiteAdmin } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedUser, setSelectedUser] = useState<any>(null)

  useEffect(() => {
    if (!user || !isSiteAdmin()) {
      router.push("/hub")
      return
    }
  }, [user, isSiteAdmin, router])

  // Mock user data
  const mockUsers = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@email.com",
      avatar: "/avatars/john.jpg",
      siteRole: "user",
      status: "active",
      joinedDate: "2024-01-15",
      lastActive: "2024-12-18",
      suburb: "Bondi Beach",
      totalRides: 23,
      clubsJoined: 2,
      reports: 0,
    },
    {
      id: "2",
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      avatar: "/avatars/sarah.jpg",
      siteRole: "user",
      status: "active",
      joinedDate: "2024-02-20",
      lastActive: "2024-12-17",
      suburb: "Manly",
      totalRides: 45,
      clubsJoined: 3,
      reports: 0,
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike.johnson@email.com",
      avatar: "/avatars/mike.jpg",
      siteRole: "user",
      status: "suspended",
      joinedDate: "2024-03-10",
      lastActive: "2024-12-10",
      suburb: "Surry Hills",
      totalRides: 12,
      clubsJoined: 1,
      reports: 2,
    },
    {
      id: "4",
      name: "Emma Davis",
      email: "emma.davis@email.com",
      avatar: "/avatars/emma.jpg",
      siteRole: "user",
      status: "active",
      joinedDate: "2024-04-05",
      lastActive: "2024-12-18",
      suburb: "Paddington",
      totalRides: 67,
      clubsJoined: 4,
      reports: 0,
    },
  ]

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || user.siteRole === filterRole
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleUserAction = (userId: string, action: string) => {
    console.log(`Performing ${action} on user ${userId}`)
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
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage all users across the platform</p>
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
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="site_admin">Site Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription>All registered users on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((userData) => (
                <div key={userData.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userData.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {userData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{userData.name}</h3>
                        <p className="text-sm text-muted-foreground">{userData.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge
                            variant={
                              userData.status === "active"
                                ? "default"
                                : userData.status === "suspended"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {userData.status}
                          </Badge>
                          <Badge variant="outline">{userData.siteRole}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {userData.suburb}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          {userData.totalRides} rides
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {userData.clubsJoined} clubs
                        </div>
                        <div className="text-xs text-muted-foreground">Last active: {userData.lastActive}</div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedUser(userData)}>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>User Details: {selectedUser?.name}</DialogTitle>
                            <DialogDescription>Comprehensive user information and management options</DialogDescription>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {selectedUser.name
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                                  <p className="text-muted-foreground">{selectedUser.email}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant={selectedUser.status === "active" ? "default" : "destructive"}>
                                      {selectedUser.status}
                                    </Badge>
                                    <Badge variant="outline">{selectedUser.siteRole}</Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Account Information</h4>
                                  <div className="text-sm space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Joined: {selectedUser.joinedDate}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Activity className="h-4 w-4" />
                                      Last active: {selectedUser.lastActive}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Location: {selectedUser.suburb}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium">Activity Stats</h4>
                                  <div className="text-sm space-y-1">
                                    <div>Total rides: {selectedUser.totalRides}</div>
                                    <div>Clubs joined: {selectedUser.clubsJoined}</div>
                                    <div>Reports: {selectedUser.reports}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUserAction(selectedUser.id, "promote")}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Promote to Admin
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUserAction(selectedUser.id, "message")}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Message
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUserAction(selectedUser.id, "suspend")}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend User
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
                          <DropdownMenuItem onClick={() => handleUserAction(userData.id, "promote")}>
                            <Shield className="h-4 w-4 mr-2" />
                            Promote to Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(userData.id, "message")}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(userData.id, "verify")}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Verify Account
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUserAction(userData.id, "suspend")}
                            className="text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Suspend User
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
