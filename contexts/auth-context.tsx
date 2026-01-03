"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { cognitoAuth } from "@/lib/auth/cognito-service"
import { api } from "@/lib/api/api-client"

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
  applyToClub: (application: Omit<ClubApplication, "id" | "applicationDate" | "status">) => Promise<void>
  leaveClub: (clubId: string) => Promise<void>
  updatePreferences: (preferences: Partial<User["preferences"]>) => void
  hasAppliedToClub: (clubId: string) => boolean
  isMemberOfClub: (clubId: string) => boolean
  isClubAdmin: (clubId: string) => boolean
  getAdminClubs: () => ClubMembership[]
  approveApplication: (applicationId: string) => Promise<void>
  rejectApplication: (applicationId: string, reason?: string) => Promise<void>
  createRide: (clubId: string, ride: any) => Promise<void>
  updateClubProfile: (clubId: string, updates: any) => Promise<void>
  addClubLeader: (clubId: string, leader: any) => Promise<void>
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for existing authentication on mount
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    setIsLoading(true)
    
    try {
      // Check if user is authenticated with Cognito
      if (cognitoAuth.isAuthenticated()) {
        const cognitoUser = await cognitoAuth.getCurrentUser()
        
        if (cognitoUser) {
          // Fetch full user profile from backend
          const userResponse = await api.user.getCurrent()
          
          if (userResponse.success && userResponse.data) {
            // Handle nested response structure from backend
            const backendUser = userResponse.data.data || userResponse.data
            const frontendUser: User = {
              id: backendUser.id || cognitoUser.sub,
              name: backendUser.displayName || backendUser.name || cognitoUser.name || cognitoUser.given_name || 'User',
              email: backendUser.email || cognitoUser.email,
              suburb: backendUser.suburb,
              avatar: backendUser.avatarUrl || backendUser.avatar,
              siteRole: backendUser.systemRole === 'SiteAdmin' ? 'site_admin' : 'user',
              joinedClubs: [], // Will be populated from memberships API
              clubApplications: [],
              rideAssignments: [],
              preferences: backendUser.preferences || getDefaultPreferences(),
            }
            
            // Fetch user memberships
            const membershipsResponse = await api.user.getMemberships()
            if (membershipsResponse.success && membershipsResponse.data) {
              // Handle nested response structure for memberships
              const membershipsData = membershipsResponse.data.data?.data || membershipsResponse.data.data || membershipsResponse.data
              if (Array.isArray(membershipsData)) {
                frontendUser.joinedClubs = membershipsData.map((membership: any) => ({
                  clubId: membership.clubId,
                  clubName: membership.clubName,
                  joinedDate: membership.joinedAt || membership.joinedDate,
                  membershipType: membership.status,
                  role: membership.role,
                }))
              }
            }
            
            setUser(frontendUser)
            setIsAuthenticated(true)
          } else {
            // Backend user not found, sign out
            await cognitoAuth.signOut()
            setIsAuthenticated(false)
          }
        } else {
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    try {
      const result = await cognitoAuth.signIn(email, password)
      
      if (result.success && result.tokens) {
        // Fetch user profile after successful login
        await initializeAuth()
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.message || 'Login failed' 
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<{ 
    success: boolean; 
    error?: string;
    needsVerification?: boolean;
  }> => {
    setIsLoading(true)
    
    try {
      const result = await cognitoAuth.signUp(email, password, name)
      
      if (result.success) {
        if (result.needsVerification) {
          // Store email for verification flow
          localStorage.setItem('pending_verification_email', email)
          // Temporarily store password for auto-login after verification
          sessionStorage.setItem('temp_signup_password', password)
          
          return { 
            success: true, 
            needsVerification: true 
          }
        } else {
          // User is already confirmed, try to login
          const loginResult = await cognitoAuth.signIn(email, password)
          
          if (loginResult.success) {
            await initializeAuth()
            return { success: true }
          } else {
            return { 
              success: false, 
              error: 'Account created but login failed. Please try signing in.' 
            }
          }
        }
      } else {
        return { 
          success: false, 
          error: result.message || 'Signup failed' 
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { 
        success: false, 
        error: 'Signup failed. Please try again.' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    
    try {
      await cognitoAuth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }

  // Helper function for default preferences
  const getDefaultPreferences = () => ({
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
  })

  // Club-related functions (these will call the real API)
  const applyToClub = async (applicationData: Omit<ClubApplication, "id" | "applicationDate" | "status">) => {
    if (!user) return

    try {
      const response = await api.clubs.join(applicationData.clubId, {
        message: applicationData.motivation,
        experience: applicationData.experience,
        availability: applicationData.availability,
      })

      if (response.success) {
        // Refresh user data to get updated memberships
        await initializeAuth()
      }
    } catch (error) {
      console.error('Apply to club error:', error)
      throw error
    }
  }

  const leaveClub = async (clubId: string) => {
    if (!user) return

    try {
      const response = await api.clubs.leave(clubId)
      
      if (response.success) {
        // Update local state
        const updatedUser = {
          ...user,
          joinedClubs: user.joinedClubs.filter((club) => club.clubId !== clubId),
        }
        setUser(updatedUser)
      }
    } catch (error) {
      console.error('Leave club error:', error)
      throw error
    }
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
    
    // TODO: Call API to update preferences on backend
    // api.user.update({ preferences: updatedUser.preferences })
  }

  // Helper functions
  const hasAppliedToClub = (clubId: string): boolean => {
    if (!user?.clubApplications) return false
    return user.clubApplications.some((app) => app.clubId === clubId && app.status === "pending")
  }

  const isMemberOfClub = (clubId: string): boolean => {
    if (!user?.joinedClubs) return false
    return user.joinedClubs.some((club) => club.clubId === clubId)
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

  // Placeholder functions for admin operations (will be implemented with real API calls)
  const promoteUser = async (userId: string, clubId: string, newRole: ClubRole) => {
    console.log("Promoting user:", userId, "to role:", newRole, "in club:", clubId)
  }

  const assignRideRole = async (rideId: string, userId: string, role: "captain" | "leader") => {
    console.log("Assigning ride role:", role, "to user:", userId, "for ride:", rideId)
  }

  const approveApplication = async (applicationId: string) => {
    console.log("Approving application:", applicationId)
  }

  const rejectApplication = async (applicationId: string, reason?: string) => {
    console.log("Rejecting application:", applicationId, "with reason:", reason)
  }

  const createRide = async (clubId: string, ride: any) => {
    console.log("Creating ride in club:", clubId, "with details:", ride)
  }

  const updateClubProfile = async (clubId: string, updates: any) => {
    console.log("Updating club profile for club:", clubId, "with updates:", updates)
  }

  const addClubLeader = async (clubId: string, leader: any) => {
    console.log("Adding club leader to club:", clubId, "with details:", leader)
  }

  const sendClubNotification = async (
    clubId: string,
    message: string,
    type: "ride_update" | "general" | "cancellation",
  ) => {
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
        isAuthenticated,
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
