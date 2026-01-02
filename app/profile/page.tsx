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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { User, MapPin, Calendar, Activity, Star, Award, Shield, Camera, Save, Bell, Lock, Eye } from "lucide-react"

export default function ProfilePage() {
  const { user, updatePreferences, isSiteAdmin, getUserRole } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    suburb: user?.suburb || "",
    bio: "",
    phone: "",
    emergencyContact: "",
    cyclingExperience: "intermediate",
    preferredDistance: "20-40km",
    preferredPace: "moderate",
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
  }, [user, router])

  const handleSaveProfile = () => {
    // In a real app, this would make an API call to update the user profile
    console.log("Saving profile:", profileData)
    setIsEditing(false)
  }

  const handlePreferenceChange = (category: string, setting: string, value: boolean) => {
    if (category === "notifications") {
      updatePreferences({
        notifications: {
          ...user?.preferences.notifications,
          [setting]: value,
        },
      })
    } else if (category === "privacy") {
      updatePreferences({
        privacy: {
          ...user?.preferences.privacy,
          [setting]: value,
        },
      })
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Please sign in to view your profile</h1>
          <p className="text-muted-foreground">Sign in to access your profile and settings</p>
        </div>
        <Footer />
      </div>
    )
  }

  const userRole = getUserRole()
  const roleDisplayName = isSiteAdmin()
    ? "Site Administrator"
    : user.joinedClubs.some((club) => club.role === "club_admin")
      ? "Club Administrator"
      : user.joinedClubs.some((club) => club.role === "ride_captain")
        ? "Ride Captain"
        : user.joinedClubs.some((club) => club.role === "ride_leader")
          ? "Ride Leader"
          : "Rider"

  const userStats = {
    totalRides: user.rideAssignments?.length || 0,
    totalDistance: 847, // Mock data
    averageSpeed: 24.5, // Mock data
    clubsJoined: user.joinedClubs.length,
    ridesThisMonth: 8, // Mock data
    achievements: 5, // Mock data
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information, preferences, and account settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Update your personal details and cycling preferences</CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                  >
                    {isEditing ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      "Edit Profile"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-2xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="default">{roleDisplayName}</Badge>
                      {user.suburb && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {user.suburb}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="suburb">Suburb</Label>
                      <Input
                        id="suburb"
                        value={profileData.suburb}
                        onChange={(e) => setProfileData({ ...profileData, suburb: e.target.value })}
                        disabled={!isEditing}
                        placeholder="e.g., Bondi Beach"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Tell us about your cycling journey..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience">Cycling Experience</Label>
                      <Select
                        value={profileData.cyclingExperience}
                        onValueChange={(value) => setProfileData({ ...profileData, cyclingExperience: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="distance">Preferred Distance</Label>
                      <Select
                        value={profileData.preferredDistance}
                        onValueChange={(value) => setProfileData({ ...profileData, preferredDistance: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-10km">0-10km (Short rides)</SelectItem>
                          <SelectItem value="10-20km">10-20km (Medium rides)</SelectItem>
                          <SelectItem value="20-40km">20-40km (Long rides)</SelectItem>
                          <SelectItem value="40km+">40km+ (Endurance rides)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="pace">Preferred Pace</Label>
                      <Select
                        value={profileData.preferredPace}
                        onValueChange={(value) => setProfileData({ ...profileData, preferredPace: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leisurely">Leisurely (15-20 km/h)</SelectItem>
                          <SelectItem value="moderate">Moderate (20-25 km/h)</SelectItem>
                          <SelectItem value="fast">Fast (25-30 km/h)</SelectItem>
                          <SelectItem value="competitive">Competitive (30+ km/h)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalRides}</div>
                  <p className="text-xs text-muted-foreground">{userStats.ridesThisMonth} this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalDistance}km</div>
                  <p className="text-xs text-muted-foreground">Lifetime distance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Speed</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.averageSpeed} km/h</div>
                  <p className="text-xs text-muted-foreground">Across all rides</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clubs Joined</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.clubsJoined}</div>
                  <p className="text-xs text-muted-foreground">Active memberships</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.achievements}</div>
                  <p className="text-xs text-muted-foreground">Badges earned</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2024</div>
                  <p className="text-xs text-muted-foreground">Active member</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
                <CardDescription>Your latest cycling milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200">
                    <Award className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-800">Regular Rider</h4>
                      <p className="text-sm text-green-600">Completed 10 group rides</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50 border-blue-200">
                    <Award className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-800">Distance Warrior</h4>
                      <p className="text-sm text-blue-600">Rode 500km total distance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-purple-50 border-purple-200">
                    <Award className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-purple-800">Social Cyclist</h4>
                      <p className="text-sm text-purple-600">Joined 2 cycling clubs</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you'd like to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ride Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get notified about upcoming rides you've joined</p>
                  </div>
                  <Switch
                    checked={user.preferences.notifications.rideReminders}
                    onCheckedChange={(checked) => handlePreferenceChange("notifications", "rideReminders", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Club Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive updates from your clubs</p>
                  </div>
                  <Switch
                    checked={user.preferences.notifications.clubUpdates}
                    onCheckedChange={(checked) => handlePreferenceChange("notifications", "clubUpdates", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Members</Label>
                    <p className="text-sm text-muted-foreground">Get notified when new members join your clubs</p>
                  </div>
                  <Switch
                    checked={user.preferences.notifications.newMembers}
                    onCheckedChange={(checked) => handlePreferenceChange("notifications", "newMembers", checked)}
                  />
                </div>
                {isSiteAdmin() && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Site Updates</Label>
                        <p className="text-sm text-muted-foreground">Administrative notifications and site updates</p>
                      </div>
                      <Switch
                        checked={user.preferences.notifications.siteUpdates || false}
                        onCheckedChange={(checked) => handlePreferenceChange("notifications", "siteUpdates", checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Control who can see your information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Profile</Label>
                    <p className="text-sm text-muted-foreground">Allow other members to view your profile</p>
                  </div>
                  <Switch
                    checked={user.preferences.privacy.showProfile}
                    onCheckedChange={(checked) => handlePreferenceChange("privacy", "showProfile", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Ride History</Label>
                    <p className="text-sm text-muted-foreground">Display your ride history to other members</p>
                  </div>
                  <Switch
                    checked={user.preferences.privacy.showRideHistory}
                    onCheckedChange={(checked) => handlePreferenceChange("privacy", "showRideHistory", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Contact Info</Label>
                    <p className="text-sm text-muted-foreground">Allow club leaders to see your contact information</p>
                  </div>
                  <Switch
                    checked={user.preferences.privacy.showContactInfo || false}
                    onCheckedChange={(checked) => handlePreferenceChange("privacy", "showContactInfo", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Account Security
                </CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Current Password</Label>
                    <Input type="password" placeholder="Enter current password" />
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button>Update Password</Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Emergency Contact</h4>
                  <div>
                    <Label>Emergency Contact Name</Label>
                    <Input
                      value={profileData.emergencyContact}
                      onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                      placeholder="Full name of emergency contact"
                    />
                  </div>
                  <div>
                    <Label>Emergency Contact Phone</Label>
                    <Input type="tel" placeholder="Emergency contact phone number" />
                  </div>
                  <Button variant="outline">Save Emergency Contact</Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Account Actions</h4>
                  <div className="flex gap-4">
                    <Button variant="outline">Download My Data</Button>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  )
}
