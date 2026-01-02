"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type SiteRole = "site_admin" | "user"
type ClubRole = "club_admin" | "ride_captain" | "ride_leader" | "member"

interface ClubMembership {
  clubId: string
  clubName: string
  joinedDate: string
  membershipType: "active" | "pending" | "inactive"
  role: ClubRole
}

interface RideAssignment {
  rideId: string
  rideName: string
  clubId: string
  clubName: string
  date: string
  role: "captain" | "leader" | "participant"
  status: "upcoming" | "completed" | "cancelled"
}

interface ClubApplication {
  id: string
  clubId: string
  clubName: string
  applicationDate: string
  status: "pending" | "approved" | "rejected"
  message?: string
  experience: string
  motivation: string
  availability: string[]
}

interface ClubRide {
  id: string
  name: string
  date: string
  time: string
  meetingPoint: string
  distance: string
  difficulty: "Easy" | "Moderate" | "Hard"
  description: string
  captainId: string
  leaderId?: string
  maxParticipants?: number
  currentParticipants: string[]
}

interface ClubLeader {
  id: string
  name: string
  email: string
  role: string
  bio: string
  specialties: string[]
  avatar?: string
  joinedDate: string
}

interface ClubProfile {
  id: string
  name: string
  description: string
  area: string
  focus: string
  established: string
  membershipFee: string
  profileImage?: string
  kitColors: string[]
  guidelines: string[]
  coffeeStops: string[]
  history: string
}

interface User {
  id: string
  name: string
  email: string
  suburb?: string
  avatar?: string
  siteRole: SiteRole
  joinedClubs: ClubMembership[]
  clubApplications: ClubApplication[]
  rideAssignments: RideAssignment[]
  preferences: {
    notifications: {
      rideReminders: boolean
      clubUpdates: boolean
      newMembers: boolean
      siteUpdates: boolean
    }
    privacy: {
      showProfile: boolean
      showRideHistory: boolean
      showContactInfo: boolean
    }
  }
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  applyToClub: (application: Omit<ClubApplication, "id" | "applicationDate" | "status">) => Promise<void>
  leaveClub: (clubId: string) => Promise<void>
  updatePreferences: (preferences: Partial<User["preferences"]>) => void
  hasAppliedToClub: (clubId: string) => boolean
  isMemberOfClub: (clubId: string) => boolean
  isClubAdmin: (clubId: string) => boolean
  getAdminClubs: () => ClubMembership[]
  approveApplication: (applicationId: string) => Promise<void>
  rejectApplication: (applicationId: string, reason?: string) => Promise<void>
  createRide: (clubId: string, ride: Omit<ClubRide, "id" | "currentParticipants">) => Promise<void>
  updateClubProfile: (clubId: string, updates: Partial<ClubProfile>) => Promise<void>
  addClubLeader: (clubId: string, leader: Omit<ClubLeader, "id" | "joinedDate">) => Promise<void>
  sendClubNotification: (
    clubId: string,
    message: string,
    type: "ride_update" | "general" | "cancellation",
  ) => Promise<void>
  isSiteAdmin: () => boolean
  canManageUsers: () => boolean
  canManageClub: (clubId: string) => boolean
  canManageRides: (clubId: string) => boolean
  canLeadRides: (clubId: string) => boolean
  getUserRole: (clubId?: string) => SiteRole | ClubRole
  hasPermission: (permission: string, clubId?: string) => boolean
  promoteUser: (userId: string, clubId: string, newRole: ClubRole) => Promise<void>
  assignRideRole: (rideId: string, userId: string, role: "captain" | "leader") => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem("sydney-cycles-user")
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      if (!parsedUser.clubApplications) {
        parsedUser.clubApplications = []
      }
      if (!parsedUser.siteRole) {
        parsedUser.siteRole = "user"
      }
      if (!parsedUser.rideAssignments) {
        parsedUser.rideAssignments = []
      }
      if (!parsedUser.preferences) {
        parsedUser.preferences = {
          notifications: {
            rideReminders: true,
            clubUpdates: true,
            newMembers: false,
            siteUpdates: false,
          },
          privacy: {
            showProfile: true,
            showRideHistory: true,
            showContactInfo: false,
          },
        }
      }
      if (!parsedUser.preferences.notifications) {
        parsedUser.preferences.notifications = {
          rideReminders: true,
          clubUpdates: true,
          newMembers: false,
          siteUpdates: false,
        }
      }
      if (!parsedUser.preferences.privacy) {
        parsedUser.preferences.privacy = {
          showProfile: true,
          showRideHistory: true,
          showContactInfo: false,
        }
      }
      setUser(parsedUser)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    let mockUser: User

    if (email === "siteadmin@test.com") {
      // Site Administrator profile
      mockUser = {
        id: "site-admin-1",
        name: "Site Administrator",
        email,
        suburb: "Sydney CBD",
        avatar: "/admin-avatar.png",
        siteRole: "site_admin",
        joinedClubs: [],
        rideAssignments: [],
        clubApplications: [],
        preferences: {
          notifications: {
            rideReminders: true,
            clubUpdates: true,
            newMembers: true,
            siteUpdates: true,
          },
          privacy: {
            showProfile: true,
            showRideHistory: true,
            showContactInfo: true,
          },
        },
      }
    } else if (email === "clubadmin@test.com") {
      // Club Administrator profile
      mockUser = {
        id: "club-admin-1",
        name: "Club Administrator",
        email,
        suburb: "Sydney CBD",
        avatar: "/admin-avatar.png",
        siteRole: "user",
        joinedClubs: [
          {
            clubId: "1",
            clubName: "Sydney Cycling Club",
            joinedDate: "2023-01-15",
            membershipType: "active",
            role: "club_admin",
          },
          {
            clubId: "2",
            clubName: "Eastern Suburbs Cycling Club",
            joinedDate: "2023-02-20",
            membershipType: "active",
            role: "club_admin",
          },
        ],
        rideAssignments: [],
        clubApplications: [
          {
            id: "pending-app-1",
            clubId: "1",
            clubName: "Sydney Cycling Club",
            applicationDate: "2024-12-10",
            status: "pending",
            experience: "Beginner",
            motivation: "New to cycling, want to learn from experienced riders",
            availability: ["Saturday Morning", "Sunday Morning"],
          },
        ],
        preferences: {
          notifications: {
            rideReminders: true,
            clubUpdates: true,
            newMembers: true,
            siteUpdates: false,
          },
          privacy: {
            showProfile: true,
            showRideHistory: true,
            showContactInfo: true,
          },
        },
      }
    } else if (email === "captain@test.com") {
      // Ride Captain profile
      mockUser = {
        id: "captain-1",
        name: "Marcus Thompson",
        email,
        suburb: "Bondi Beach",
        avatar: "/marcus-thompson-avatar.png",
        siteRole: "user",
        joinedClubs: [
          {
            clubId: "1",
            clubName: "Sydney Cycling Club",
            joinedDate: "2023-06-15",
            membershipType: "active",
            role: "ride_captain",
          },
        ],
        rideAssignments: [
          {
            rideId: "ride-1",
            rideName: "Harbour Bridge Loop",
            clubId: "1",
            clubName: "Sydney Cycling Club",
            date: "2024-12-22",
            role: "captain",
            status: "upcoming",
          },
          {
            rideId: "ride-2",
            rideName: "Eastern Suburbs Coastal",
            clubId: "1",
            clubName: "Sydney Cycling Club",
            date: "2024-12-15",
            role: "captain",
            status: "completed",
          },
        ],
        clubApplications: [],
        preferences: {
          notifications: {
            rideReminders: true,
            clubUpdates: true,
            newMembers: false,
            siteUpdates: false,
          },
          privacy: {
            showProfile: true,
            showRideHistory: true,
            showContactInfo: true,
          },
        },
      }
    } else if (email === "leader@test.com") {
      // Ride Leader profile
      mockUser = {
        id: "leader-1",
        name: "Sarah Chen",
        email,
        suburb: "Manly",
        siteRole: "user",
        joinedClubs: [
          {
            clubId: "1",
            clubName: "Sydney Cycling Club",
            joinedDate: "2023-08-20",
            membershipType: "active",
            role: "ride_leader",
          },
        ],
        rideAssignments: [
          {
            rideId: "ride-3",
            rideName: "Northern Beaches Tour",
            clubId: "1",
            clubName: "Sydney Cycling Club",
            date: "2024-12-20",
            role: "leader",
            status: "upcoming",
          },
        ],
        clubApplications: [],
        preferences: {
          notifications: {
            rideReminders: true,
            clubUpdates: true,
            newMembers: false,
            siteUpdates: false,
          },
          privacy: {
            showProfile: true,
            showRideHistory: true,
            showContactInfo: false,
          },
        },
      }
    } else {
      // Regular Rider profile
      mockUser = {
        id: "rider-1",
        name: email.split("@")[0],
        email,
        suburb: "Bondi Beach",
        siteRole: "user",
        joinedClubs: [
          {
            clubId: "1",
            clubName: "Sydney Cycling Club",
            joinedDate: "2024-01-15",
            membershipType: "active",
            role: "member",
          },
        ],
        rideAssignments: [
          {
            rideId: "ride-1",
            rideName: "Harbour Bridge Loop",
            clubId: "1",
            clubName: "Sydney Cycling Club",
            date: "2024-12-22",
            role: "participant",
            status: "upcoming",
          },
        ],
        clubApplications: [
          {
            id: "app-1",
            clubId: "2",
            clubName: "Eastern Suburbs Cycling Club",
            applicationDate: "2024-12-15",
            status: "pending",
            experience: "Intermediate",
            motivation: "Looking to join group rides and improve my cycling skills",
            availability: ["Saturday Morning", "Sunday Morning"],
          },
        ],
        preferences: {
          notifications: {
            rideReminders: true,
            clubUpdates: true,
            newMembers: false,
            siteUpdates: false,
          },
          privacy: {
            showProfile: true,
            showRideHistory: true,
            showContactInfo: false,
          },
        },
      }
    }

    setUser(mockUser)
    localStorage.setItem("sydney-cycles-user", JSON.stringify(mockUser))
    setIsLoading(false)
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      siteRole: "user",
      joinedClubs: [],
      clubApplications: [],
      rideAssignments: [],
      preferences: {
        notifications: {
          rideReminders: true,
          clubUpdates: true,
          newMembers: true,
          siteUpdates: false,
        },
        privacy: {
          showProfile: true,
          showRideHistory: true,
          showContactInfo: false,
        },
      },
    }

    setUser(mockUser)
    localStorage.setItem("sydney-cycles-user", JSON.stringify(mockUser))
    setIsLoading(false)
  }

  const applyToClub = async (applicationData: Omit<ClubApplication, "id" | "applicationDate" | "status">) => {
    if (!user) return

    const newApplication: ClubApplication = {
      ...applicationData,
      id: `app-${Date.now()}`,
      applicationDate: new Date().toISOString().split("T")[0],
      status: "pending",
    }

    const updatedUser = {
      ...user,
      clubApplications: [...(user.clubApplications || []), newApplication],
    }

    setUser(updatedUser)
    localStorage.setItem("sydney-cycles-user", JSON.stringify(updatedUser))
  }

  const leaveClub = async (clubId: string) => {
    if (!user) return

    const updatedUser = {
      ...user,
      joinedClubs: (user.joinedClubs || []).filter((club) => club.clubId !== clubId),
    }

    setUser(updatedUser)
    localStorage.setItem("sydney-cycles-user", JSON.stringify(updatedUser))
  }

  const hasAppliedToClub = (clubId: string): boolean => {
    if (!user?.clubApplications) return false
    return user.clubApplications.some((app) => app.clubId === clubId && app.status === "pending")
  }

  const isMemberOfClub = (clubId: string): boolean => {
    if (!user?.joinedClubs) return false
    return user.joinedClubs.some((club) => club.clubId === clubId)
  }

  const updatePreferences = (newPreferences: Partial<User["preferences"]>) => {
    if (!user) return

    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...newPreferences,
      },
    }

    setUser(updatedUser)
    localStorage.setItem("sydney-cycles-user", JSON.stringify(updatedUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("sydney-cycles-user")
  }

  const isClubAdmin = (clubId: string): boolean => {
    if (!user?.joinedClubs) return false
    const membership = user.joinedClubs.find((club) => club.clubId === clubId)
    return membership ? ["club_admin"].includes(membership.role) : false
  }

  const getAdminClubs = (): ClubMembership[] => {
    if (!user?.joinedClubs) return []
    return user.joinedClubs.filter((club) => ["club_admin", "ride_captain"].includes(club.role))
  }

  const isSiteAdmin = (): boolean => {
    return user?.siteRole === "site_admin"
  }

  const canManageUsers = (): boolean => {
    return isSiteAdmin()
  }

  const canManageClub = (clubId: string): boolean => {
    if (isSiteAdmin()) return true
    if (!user?.joinedClubs) return false
    const membership = user.joinedClubs.find((club) => club.clubId === clubId)
    return membership ? ["club_admin"].includes(membership.role) : false
  }

  const canManageRides = (clubId: string): boolean => {
    if (isSiteAdmin()) return true
    if (!user?.joinedClubs) return false
    const membership = user.joinedClubs.find((club) => club.clubId === clubId)
    return membership ? ["club_admin", "ride_captain"].includes(membership.role) : false
  }

  const canLeadRides = (clubId: string): boolean => {
    if (isSiteAdmin()) return true
    if (!user?.joinedClubs) return false
    const membership = user.joinedClubs.find((club) => club.clubId === clubId)
    return membership ? ["club_admin", "ride_captain", "ride_leader"].includes(membership.role) : false
  }

  const getUserRole = (clubId?: string): SiteRole | ClubRole => {
    if (!clubId) return user?.siteRole || "user"
    if (!user?.joinedClubs) return "user"
    const membership = user.joinedClubs.find((club) => club.clubId === clubId)
    return membership?.role || "member"
  }

  const hasPermission = (permission: string, clubId?: string): boolean => {
    switch (permission) {
      case "manage_site":
        return isSiteAdmin()
      case "manage_users":
        return canManageUsers()
      case "manage_club":
        return clubId ? canManageClub(clubId) : false
      case "manage_rides":
        return clubId ? canManageRides(clubId) : false
      case "lead_rides":
        return clubId ? canLeadRides(clubId) : false
      case "view_analytics":
        return isSiteAdmin() || (clubId ? canManageClub(clubId) : false)
      default:
        return false
    }
  }

  const promoteUser = async (userId: string, clubId: string, newRole: ClubRole) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Promoting user:", userId, "to role:", newRole, "in club:", clubId)
  }

  const assignRideRole = async (rideId: string, userId: string, role: "captain" | "leader") => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log("Assigning ride role:", role, "to user:", userId, "for ride:", rideId)
  }

  const approveApplication = async (applicationId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Approving application:", applicationId)
  }

  const rejectApplication = async (applicationId: string, reason?: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Rejecting application:", applicationId, "with reason:", reason)
  }

  const createRide = async (clubId: string, ride: Omit<ClubRide, "id" | "currentParticipants">) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Creating ride in club:", clubId, "with details:", ride)
  }

  const updateClubProfile = async (clubId: string, updates: Partial<ClubProfile>) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Updating club profile for club:", clubId, "with updates:", updates)
  }

  const addClubLeader = async (clubId: string, leader: Omit<ClubLeader, "id" | "joinedDate">) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Adding club leader to club:", clubId, "with details:", leader)
  }

  const sendClubNotification = async (
    clubId: string,
    message: string,
    type: "ride_update" | "general" | "cancellation",
  ) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Sending club notification for club:", clubId, "with message:", message, "and type:", type)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isLoading,
        applyToClub,
        leaveClub,
        updatePreferences,
        hasAppliedToClub,
        isMemberOfClub,
        isClubAdmin,
        getAdminClubs,
        approveApplication,
        rejectApplication,
        createRide,
        updateClubProfile,
        addClubLeader,
        sendClubNotification,
        isSiteAdmin,
        canManageUsers,
        canManageClub,
        canManageRides,
        canLeadRides,
        getUserRole,
        hasPermission,
        promoteUser,
        assignRideRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
