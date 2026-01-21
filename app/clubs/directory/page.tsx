"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Users,
  MapPin,
  Calendar,
  Mail,
  ExternalLink,
  Search,
  Filter,
  X,
  ChevronDown,
  Heart,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { ClubApplicationForm } from "@/components/club-application-form"
import { useRouter } from "next/navigation"
import { useClubsDiscovery } from "@/hooks/use-clubs-discovery"

export default function ClubDirectoryPage() {
  const { user, hasAppliedToClub, isMemberOfClub } = useAuth()
  const router = useRouter()
  const [useDropdownMode, setUseDropdownMode] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [areaValue, setAreaValue] = useState("")
  const [paceValue, setPaceValue] = useState("")
  const [beginnerFriendlyValue, setBeginnerFriendlyValue] = useState("")
  const [showApplicationForm, setShowApplicationForm] = useState<{ clubId: string; clubName: string } | null>(null)

  // Fetch real club data from backend
  const { data: discoveryData, isLoading, isError, error } = useClubsDiscovery({
    search: searchValue,
    area: areaValue,
    limit: 50,
  })

  // Debug: Log the response structure
  useEffect(() => {
    if (discoveryData) {
      console.log('Discovery data:', discoveryData)
      console.log('Clubs array:', discoveryData.clubs)
    }
  }, [discoveryData])

  const filtersRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const checkFiltersLayout = useCallback(() => {
    if (!filtersRef.current) return

    const container = filtersRef.current
    const containerWidth = container.offsetWidth
    const searchInput = container.querySelector("input")
    const searchWidth = searchInput ? searchInput.offsetWidth : 200

    const filterWidth = 180
    const minSpaceNeeded = filterWidth * 3 + 48
    const availableSpace = containerWidth - searchWidth - 48

    const shouldUseDropdown = window.innerWidth < 1024 && availableSpace < minSpaceNeeded

    setUseDropdownMode(shouldUseDropdown)
  }, [])

  useEffect(() => {
    const debouncedCheck = debounce(checkFiltersLayout, 50)

    checkFiltersLayout()

    if (filtersRef.current) {
      resizeObserverRef.current = new ResizeObserver(debouncedCheck)
      resizeObserverRef.current.observe(filtersRef.current)
    }

    window.addEventListener("resize", debouncedCheck)

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      window.removeEventListener("resize", debouncedCheck)
    }
  }, [checkFiltersLayout])

  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (areaValue && areaValue !== "all") count++
    if (paceValue && paceValue !== "all") count++
    if (beginnerFriendlyValue && beginnerFriendlyValue !== "all") count++
    return count
  }

  const clearAllFilters = () => {
    setAreaValue("")
    setPaceValue("")
    setBeginnerFriendlyValue("")
  }

  const getActiveFilterBadges = () => {
    const badges = []
    if (areaValue && areaValue !== "all") {
      badges.push({ key: "area", label: `Area: ${areaValue}`, clear: () => setAreaValue("") })
    }
    if (paceValue && paceValue !== "all") {
      badges.push({ key: "pace", label: `Pace: ${paceValue}`, clear: () => setPaceValue("") })
    }
    if (beginnerFriendlyValue && beginnerFriendlyValue !== "all") {
      badges.push({
        key: "beginner",
        label: `Beginner: ${beginnerFriendlyValue}`,
        clear: () => setBeginnerFriendlyValue(""),
      })
    }
    return badges
  }

  // Enhanced mock data for development (maps to real club IDs when available)
  const mockEnhancements: Record<string, any> = {
    "sydney-cycling-club": {
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
      rideTypes: ["Road Racing", "Time Trials", "Training Rides", "Hill Climbs"],
      beginnerFriendly: false,
      membershipFee: "$120/year",
      kitColors: ["Navy", "White", "Red"],
      image: "/sydney-cycling-club-racing-team.png",
    },
    "manly-warringah-cycling-club": {
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
      rideTypes: ["Social Rides", "Beach Routes", "Coffee Rides", "Weekend Tours"],
      beginnerFriendly: true,
      membershipFee: "$80/year",
      kitColors: ["Blue", "Yellow", "White"],
      image: "/manly-warringah-cycling-club-beach.png",
    },
    "eastern-suburbs-cycling-club": {
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
      rideTypes: ["Coastal Rides", "Park Loops", "Café Stops", "Skills Sessions"],
      beginnerFriendly: true,
      membershipFee: "$90/year",
      kitColors: ["Green", "White", "Black"],
      image: "/eastern-suburbs-cycling-club-coastal.png",
    },
  }

  // Merge real backend data with mock enhancements
  const clubs = useMemo(() => {
    // discoveryData is the ClubDiscoveryResponse: { clubs: [...], pagination: {...} }
    if (!discoveryData?.clubs || !Array.isArray(discoveryData.clubs)) return []

    return discoveryData.clubs.map((club) => {
      const enhancement = mockEnhancements[club.id] || {}
      return {
        id: club.id,
        name: club.name,
        description: club.description || enhancement.description || "A cycling club in Sydney",
        area: club.city || enhancement.area || "Sydney",
        members: enhancement.members || 50,
        established: enhancement.established || "2020",
        focus: enhancement.focus || "Cycling",
        pace: enhancement.pace || "Mixed",
        weeklyRides: enhancement.weeklyRides || 2,
        meetingDay: enhancement.meetingDay || "TBD",
        contact: enhancement.contact || "contact@club.com",
        phone: enhancement.phone || "(02) 0000 0000",
        website: enhancement.website || "club.com",
        rideTypes: enhancement.rideTypes || ["Group Rides", "Social Rides"],
        beginnerFriendly: enhancement.beginnerFriendly !== undefined ? enhancement.beginnerFriendly : true,
        membershipFee: enhancement.membershipFee || "$80/year",
        kitColors: enhancement.kitColors || ["Blue", "White"],
        image: club.logoUrl || enhancement.image || "/placeholder.svg",
      }
    })
  }, [discoveryData])

  // Apply client-side filters (pace and beginner-friendly)
  const filteredClubs = useMemo(() => {
    let filtered = clubs

    // Pace filter
    if (paceValue && paceValue !== "all") {
      filtered = filtered.filter((club) => club.pace.toLowerCase() === paceValue.toLowerCase())
    }

    // Beginner friendly filter
    if (beginnerFriendlyValue && beginnerFriendlyValue !== "all") {
      const showBeginnerFriendly = beginnerFriendlyValue === "yes"
      filtered = filtered.filter((club) => club.beginnerFriendly === showBeginnerFriendly)
    }

    return filtered
  }, [clubs, paceValue, beginnerFriendlyValue])
  const handleClubAction = (club: any) => {
    // Check if user is logged in
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (isMemberOfClub(club.id)) {
      alert("You are already a member of this club")
      return
    }

    if (hasAppliedToClub(club.id)) {
      alert("You have already applied to this club. Please wait for approval.")
      return
    }

    setShowApplicationForm({ clubId: club.id, clubName: club.name })
  }

  const getClubButtonText = (clubId: string) => {
    if (!user) return "Sign in to Join"
    if (isMemberOfClub(clubId)) return "Joined"
    if (hasAppliedToClub(clubId)) return "Application Pending"
    return "Apply to Join"
  }

  const getClubButtonVariant = (clubId: string) => {
    if (!user) return "default"
    if (isMemberOfClub(clubId)) return "default"
    if (hasAppliedToClub(clubId)) return "outline"
    return "default"
  }

  const getClubButtonIcon = (clubId: string) => {
    if (!user) return null
    if (isMemberOfClub(clubId)) return <CheckCircle className="h-4 w-4 mr-1" />
    if (hasAppliedToClub(clubId)) return <Clock className="h-4 w-4 mr-1" />
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Club Directory</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover and join Sydney's cycling clubs. Apply to clubs that match your interests and connect with fellow
            cyclists.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
          <div ref={filtersRef} className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search - Always visible */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search clubs..."
                  className="w-full pl-10 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>

              {/* Individual Filters or Dropdown */}
              {!useDropdownMode ? (
                <>
                  <Select value={areaValue} onValueChange={setAreaValue}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      <SelectItem value="city">City & Inner West</SelectItem>
                      <SelectItem value="eastern">Eastern Suburbs</SelectItem>
                      <SelectItem value="northern">Northern Beaches</SelectItem>
                      <SelectItem value="southern">Southern Suburbs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paceValue} onValueChange={setPaceValue}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Pace" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Paces</SelectItem>
                      <SelectItem value="relaxed">Relaxed</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={beginnerFriendlyValue} onValueChange={setBeginnerFriendlyValue}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Beginner Friendly" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clubs</SelectItem>
                      <SelectItem value="yes">Beginner Friendly</SelectItem>
                      <SelectItem value="no">Experienced Only</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[200px] sm:min-w-[180px] sm:flex-none justify-between bg-white border-gray-300 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                        {getActiveFiltersCount() > 0 && (
                          <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs">
                            {getActiveFiltersCount()}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[280px] p-4"
                    align="start"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filters</h4>
                        {getActiveFiltersCount() > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-1 text-xs">
                            Clear All
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Area</label>
                          <Select value={areaValue} onValueChange={setAreaValue}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Areas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Areas</SelectItem>
                              <SelectItem value="city">City & Inner West</SelectItem>
                              <SelectItem value="eastern">Eastern Suburbs</SelectItem>
                              <SelectItem value="northern">Northern Beaches</SelectItem>
                              <SelectItem value="southern">Southern Suburbs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Pace</label>
                          <Select value={paceValue} onValueChange={setPaceValue}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Paces" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Paces</SelectItem>
                              <SelectItem value="relaxed">Relaxed</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="fast">Fast</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Beginner Friendly</label>
                          <Select value={beginnerFriendlyValue} onValueChange={setBeginnerFriendlyValue}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Clubs" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Clubs</SelectItem>
                              <SelectItem value="yes">Beginner Friendly</SelectItem>
                              <SelectItem value="no">Experienced Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Active Filter Badges */}
            {getActiveFilterBadges().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getActiveFilterBadges().map((badge) => (
                  <Badge key={badge.key} variant="secondary" className="flex items-center gap-1">
                    {badge.label}
                    <button onClick={badge.clear} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clubs Grid */}
        <div className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading clubs...</p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-3 py-6">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Failed to load clubs</p>
                  <p className="text-sm text-red-700">{error instanceof Error ? error.message : 'Please try again later'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !isError && filteredClubs.length === 0 && (
            <Card className="border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No clubs found</p>
                <p className="text-gray-600 text-center max-w-md">
                  Try adjusting your filters or search terms to find clubs that match your interests.
                </p>
                {getActiveFiltersCount() > 0 && (
                  <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clubs List */}
          {!isLoading && !isError && filteredClubs.map((club, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden p-0">
              <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="relative h-48 md:h-auto md:w-80 flex-shrink-0">
                  <Image
                    src={club.image || "/placeholder.svg"}
                    alt={`${club.name} cycling group`}
                    fill
                    className="object-cover"
                  />
                  {user && isMemberOfClub(club.id) && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Joined
                    </div>
                  )}
                  {user && hasAppliedToClub(club.id) && (
                    <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{club.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mb-3">
                          <MapPin className="h-4 w-4" />
                          {club.area}
                        </CardDescription>
                        <p className="text-sm text-gray-600 line-clamp-2">{club.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          {club.members} members
                        </div>
                        <div className="text-xs text-gray-500">Est. {club.established}</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 pb-6 pt-0 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Key Info Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Focus:</span>
                          <div className="text-gray-600">{club.focus}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Pace:</span>
                          <div className="text-gray-600">{club.pace}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Weekly Rides:</span>
                          <div className="text-gray-600">{club.weeklyRides}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Membership:</span>
                          <div className="text-gray-600">{club.membershipFee}</div>
                        </div>
                      </div>

                      {/* Ride Types and Beginner Friendly */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {club.rideTypes.slice(0, 3).map((type, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {club.rideTypes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{club.rideTypes.length - 3} more
                            </Badge>
                          )}
                        </div>
                        {club.beginnerFriendly && (
                          <Badge className="bg-green-100 text-green-800 w-fit">
                            <Heart className="w-3 h-3 mr-1" />
                            Beginner Friendly
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Bottom Section with Contact and Actions */}
                    <div className="space-y-3 pt-4 border-t mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Meetings: {club.meetingDay}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
                          <div className="flex gap-1 flex-shrink-0">
                            {club.kitColors.map((color, idx) => (
                              <div
                                key={idx}
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.toLowerCase() }}
                                title={color}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{club.contact}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant={getClubButtonVariant(club.id)}
                            onClick={() => handleClubAction(club)}
                            disabled={user && (isMemberOfClub(club.id) || hasAppliedToClub(club.id))}
                            className={
                              user && hasAppliedToClub(club.id) ? "bg-orange-100 text-orange-700 border-orange-300" : ""
                            }
                          >
                            {getClubButtonIcon(club.id)}
                            {getClubButtonText(club.id)}
                          </Button>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Website
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {showApplicationForm && (
        <ClubApplicationForm
          clubId={showApplicationForm.clubId}
          clubName={showApplicationForm.clubName}
          onClose={() => setShowApplicationForm(null)}
        />
      )}

      <Footer />
    </div>
  )
}
