"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  MapPin,
  Clock,
  TrendingUp,
  Users,
  ExternalLink,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
  Trees,
  Eye,
  Coffee,
  Anchor,
  Heart,
  Mountain,
  Zap,
} from "lucide-react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"

export default function RoutesPage() {
  const [selectedRide, setSelectedRide] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const [useDropdownMode, setUseDropdownMode] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("")
  const [distanceFilter, setDistanceFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  const filtersRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const checkFiltersLayout = useCallback(() => {
    if (!filtersRef.current) return

    const container = filtersRef.current
    const containerWidth = container.offsetWidth
    const searchInput = container.querySelector("input")
    const searchWidth = searchInput ? searchInput.offsetWidth : 200

    const filterWidth = 180
    const minSpaceNeeded = filterWidth * 3 + 32
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
    if (difficultyFilter && difficultyFilter !== "all") count++
    if (distanceFilter && distanceFilter !== "all") count++
    if (typeFilter && typeFilter !== "all") count++
    return count
  }

  const clearAllFilters = () => {
    setSearchValue("")
    setDifficultyFilter("")
    setDistanceFilter("")
    setTypeFilter("")
  }

  const getActiveFilterBadges = () => {
    const badges = []
    if (difficultyFilter && difficultyFilter !== "all") {
      badges.push({ key: "difficulty", label: `Difficulty: ${difficultyFilter}`, clear: () => setDifficultyFilter("") })
    }
    if (distanceFilter && distanceFilter !== "all") {
      const distanceLabel =
        distanceFilter === "short"
          ? "Under 50km"
          : distanceFilter === "medium"
            ? "50-80km"
            : distanceFilter === "long"
              ? "80km+"
              : distanceFilter
      badges.push({ key: "distance", label: `Distance: ${distanceLabel}`, clear: () => setDistanceFilter("") })
    }
    if (typeFilter && typeFilter !== "all") {
      const typeLabel =
        typeFilter === "regular" ? "Regular Rides" : typeFilter === "captains" ? "Captain's Rides" : typeFilter
      badges.push({ key: "type", label: `Type: ${typeLabel}`, clear: () => setTypeFilter("") })
    }
    return badges
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "moderate":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const openRideModal = (ride: any) => {
    setSelectedRide(ride)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedRide(null)
  }

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.8
      const newScrollLeft = carouselRef.current.scrollLeft + (direction === "right" ? scrollAmount : -scrollAmount)
      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      })
    }
  }

  const regularRides = [
    {
      name: "Three Gorges",
      time: "5:55 AM",
      distance: "92km",
      elevation: "1406m",
      difficulty: "Hard",
      description: "Challenging ride through scenic gorge landscapes",
      startLocation: "St Leonards Park",
      highlights: ["Scenic gorges", "Mountain views", "Challenging climbs"],
      highlightIcons: [
        { icon: Mountain, label: "Scenic gorges" },
        { icon: Eye, label: "Mountain views" },
        { icon: TrendingUp, label: "Challenging climbs" },
      ],
      image: "/three-gorges-cycling-route.png",
      detailedInfo: {
        meetingPoint: "St Leonards Park - Main parking area",
        route: "St Leonards Park → Three Gorges → Mountain passes → Return via scenic route",
        paceGroups: ["A Group: 35+ km/h", "B Group: 30-35 km/h"],
        whatToBring: ["Water bottles", "Energy snacks", "Spare tube", "Helmet (mandatory)"],
        weatherPolicy: "Rides cancelled in heavy rain or dangerous conditions",
        contact: "Ride Leader: Alex M. - 0412 345 678",
      },
    },
    {
      name: "CP Thursdays",
      time: "6:25 AM",
      distance: "40km",
      elevation: "200m",
      difficulty: "Easy",
      description: "Thursday morning social ride with coffee stop",
      startLocation: "Horse Gates",
      highlights: ["Social ride", "Coffee culture", "Morning start"],
      highlightIcons: [
        { icon: Heart, label: "Social ride" },
        { icon: Coffee, label: "Coffee culture" },
        { icon: Clock, label: "Morning start" },
      ],
      image: "/cp-thursdays-cycling-route.png",
      detailedInfo: {
        meetingPoint: "Horse Gates - Main entrance",
        route: "Horse Gates → Local circuit → Coffee stop → Return",
        paceGroups: ["Social Group: 20-25 km/h", "Relaxed pace with coffee break"],
        whatToBring: ["Water bottle", "Money for coffee", "Helmet (mandatory)", "Good vibes"],
        weatherPolicy: "All weather ride - modified route in rain",
        contact: "Ride Leader: Sarah K. - 0423 456 789",
      },
    },
    {
      name: "Waterfall",
      time: "5:55 AM",
      distance: "83km",
      elevation: "726m",
      difficulty: "Moderate",
      description: "Scenic ride featuring beautiful waterfall destinations",
      startLocation: "Supa Center",
      highlights: ["Waterfall views", "Natural beauty", "Photo opportunities"],
      highlightIcons: [
        { icon: Anchor, label: "Waterfall views" },
        { icon: Trees, label: "Natural beauty" },
        { icon: Eye, label: "Photo opportunities" },
      ],
      image: "/waterfall-cycling-route.png",
      detailedInfo: {
        meetingPoint: "Supa Center - Main parking area",
        route: "Supa Center → Waterfall circuit → Scenic lookouts → Return",
        paceGroups: ["A Group: 30-35 km/h", "B Group: 25-30 km/h"],
        whatToBring: ["Water bottles", "Camera", "Spare tube", "Helmet (mandatory)"],
        weatherPolicy: "Rides proceed in light rain - cancelled in storms",
        contact: "Ride Leader: Mike T. - 0434 567 890",
      },
    },
    {
      name: "Ball Hill Loop",
      time: "5:55 AM",
      distance: "116km",
      elevation: "1373m",
      difficulty: "Hard",
      description: "Epic hill climbing challenge with rewarding views",
      startLocation: "Supa Center",
      highlights: ["Hill climbs", "Epic distance", "Fitness challenge"],
      highlightIcons: [
        { icon: Mountain, label: "Hill climbs" },
        { icon: TrendingUp, label: "Epic distance" },
        { icon: Zap, label: "Fitness challenge" },
      ],
      image: "/ball-hill-loop-cycling-route.png",
      detailedInfo: {
        meetingPoint: "Supa Center - Main parking area",
        route: "Supa Center → Ball Hill → Extended loop → Multiple climbs → Return",
        paceGroups: ["Strong Group: 32+ km/h", "Endurance Group: 28-32 km/h"],
        whatToBring: ["Multiple water bottles", "Energy food", "Spare tubes", "Helmet (mandatory)", "Climbing legs!"],
        weatherPolicy: "Rides cancelled in severe weather conditions",
        contact: "Ride Leader: James R. - 0445 678 901",
      },
    },
  ]

  const captainsRides = [
    {
      name: "Blue Mountains Epic",
      distance: "120km",
      elevation: "2,200m",
      difficulty: "Hard",
      description: "Challenging mountain ride through scenic Blue Mountains",
      highlights: ["Springwood", "Wentworth Falls", "Leura", "Katoomba"],
      stravaLink: "https://www.strava.com/routes/123456",
      image: "/blue-mountains-epic-cycling-route.png",
    },
    {
      name: "Royal National Park Loop",
      distance: "85km",
      elevation: "1,100m",
      difficulty: "Moderate",
      description: "Beautiful coastal and bushland scenery",
      highlights: ["Audley", "Bundeena", "Stanwell Park", "Sea Cliff Bridge"],
      stravaLink: "https://www.strava.com/routes/123457",
      image: "/royal-national-park-loop-cycling.png",
    },
    {
      name: "Northern Beaches Circuit",
      distance: "95km",
      elevation: "800m",
      difficulty: "Moderate",
      description: "Stunning coastal ride along Sydney's northern beaches",
      highlights: ["Manly", "Dee Why", "Avalon", "Palm Beach"],
      stravaLink: "https://www.strava.com/routes/123458",
      image: "/northern-beaches-circuit-cycling.png",
    },
    {
      name: "Hawkesbury River Ride",
      distance: "110km",
      elevation: "900m",
      difficulty: "Hard",
      description: "Scenic river valleys and historic townships",
      highlights: ["Windsor", "Richmond", "Wisemans Ferry", "River views"],
      stravaLink: "https://www.strava.com/routes/123459",
      image: "/hawkesbury-river-ride-cycling.png",
    },
    {
      name: "Southern Highlands Explorer",
      distance: "130km",
      elevation: "1,800m",
      difficulty: "Hard",
      description: "Rolling hills and charming country towns",
      highlights: ["Bowral", "Mittagong", "Robertson", "Kangaroo Valley"],
      stravaLink: "https://www.strava.com/routes/123460",
      image: "/southern-highlands-explorer-cycling.png",
    },
    {
      name: "Central Coast Classic",
      distance: "100km",
      elevation: "1,200m",
      difficulty: "Hard",
      description: "Coastal and hinterland combination ride",
      highlights: ["Gosford", "Terrigal", "Avoca Beach", "Brisbane Water"],
      stravaLink: "https://www.strava.com/routes/123461",
      image: "/central-coast-classic-cycling.png",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sydney Cycling Routes</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover Sydney's best cycling routes from our comprehensive collection. From regular weekly rides to epic
            captain's adventures, find your perfect ride.
          </p>
        </div>

        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
          <div ref={filtersRef} className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search routes..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-10 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              {!useDropdownMode ? (
                <>
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Distances</SelectItem>
                      <SelectItem value="short">Under 50km</SelectItem>
                      <SelectItem value="medium">50-80km</SelectItem>
                      <SelectItem value="long">80km+</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="regular">Regular Rides</SelectItem>
                      <SelectItem value="captains">Captain's Rides</SelectItem>
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
                          <label className="text-sm font-medium mb-1 block">Difficulty</label>
                          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Levels" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Levels</SelectItem>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Distance</label>
                          <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Distances" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Distances</SelectItem>
                              <SelectItem value="short">Under 50km</SelectItem>
                              <SelectItem value="medium">50-80km</SelectItem>
                              <SelectItem value="long">80km+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Type</label>
                          <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="regular">Regular Rides</SelectItem>
                              <SelectItem value="captains">Captain's Rides</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

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

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Regular Weekly Rides</h2>
          </div>

          <div className="relative">
            <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-x-hidden">
              <div className="pl-4 sm:pl-6 lg:pl-8">
                <div
                  ref={carouselRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    paddingRight: "1rem",
                  }}
                >
                  {regularRides.map((ride, index) => (
                    <div key={index} className="flex-none w-[85%] sm:w-[45%] lg:w-[30%] snap-start">
                      <Card className="hover:shadow-lg transition-shadow overflow-hidden h-full p-0">
                        <div className="relative h-48 w-full">
                          <Image
                            src={ride.image || "/placeholder.svg"}
                            alt={`${ride.name} cycling route`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardHeader className="px-4 pt-1 pb-0">
                          <div className="flex justify-between items-start mb-1">
                            <CardTitle className="text-lg">{ride.name}</CardTitle>
                            <Badge className={getDifficultyColor(ride.difficulty)}>{ride.difficulty}</Badge>
                          </div>
                          <CardDescription>{ride.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{ride.time}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{ride.startLocation}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="font-medium">Distance:</span>
                                <br />
                                <span className="text-gray-600">{ride.distance}</span>
                              </div>
                              <div>
                                <span className="font-medium">Elevation:</span>
                                <br />
                                <span className="text-gray-600">{ride.elevation}</span>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-start py-2">
                                <div className="flex flex-wrap gap-2 justify-start">
                                  {ride.highlightIcons.map((highlight, idx) => {
                                    const IconComponent = highlight.icon
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs border border-gray-300 hover:bg-gray-200 transition-colors"
                                        title={highlight.label}
                                      >
                                        <IconComponent className="h-3 w-3" />
                                        <span className="sr-only">{highlight.label}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 bg-transparent"
                              onClick={() => openRideModal(ride)}
                            >
                              More Info
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 mt-6 pr-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full w-10 h-10 p-0 bg-white hover:bg-gray-50 border-gray-300 shadow-sm"
                    onClick={() => scrollCarousel("left")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full w-10 h-10 p-0 bg-white hover:bg-gray-50 border-gray-300 shadow-sm"
                    onClick={() => scrollCarousel("right")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Captain's Rides</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Epic adventures and challenging routes led by experienced captains. Perfect for pushing your limits and
            exploring new territories.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {captainsRides.map((ride, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden p-0">
                <div className="relative h-48 w-full">
                  <Image
                    src={ride.image || "/placeholder.svg"}
                    alt={`${ride.name} cycling route`}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{ride.name}</CardTitle>
                    <Badge className={getDifficultyColor(ride.difficulty)}>{ride.difficulty}</Badge>
                  </div>
                  <CardDescription>{ride.description}</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Distance:</span>
                        <br />
                        <span className="text-gray-600">{ride.distance}</span>
                      </div>
                      <div>
                        <span className="font-medium">Elevation:</span>
                        <br />
                        <span className="text-gray-600">{ride.elevation}</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-sm">Route Highlights:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ride.highlights.map((highlight, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent" asChild>
                      <a href={ride.stravaLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Strava
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-8 border border-orange-200">
          <Users className="h-12 w-12 mx-auto mb-4 text-orange-600" />
          <h2 className="text-2xl font-bold mb-4">Ready to Join a Ride?</h2>
          <p className="text-lg mb-6 text-muted-foreground">
            Connect with Sydney's cycling community and discover new routes together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Find Local Clubs
            </Button>
            <Button size="lg" variant="outline">
              Browse Coffee Stops
            </Button>
          </div>
        </section>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            {selectedRide && (
              <div className="space-y-0">
                <div className="relative h-64 w-full">
                  <Image
                    src={selectedRide.image || "/placeholder.svg"}
                    alt={`${selectedRide.name} cycling route`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h1 className="text-3xl font-bold mb-2">{selectedRide.name}</h1>
                    <p className="text-lg opacity-90">{selectedRide.description}</p>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{selectedRide.time}</div>
                      <div className="text-sm text-gray-600">Start Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{selectedRide.distance}</div>
                      <div className="text-sm text-gray-600">Distance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{selectedRide.elevation}</div>
                      <div className="text-sm text-gray-600">Elevation</div>
                    </div>
                    <div className="text-center">
                      <Badge className={getDifficultyColor(selectedRide.difficulty)} variant="secondary">
                        {selectedRide.difficulty}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">Difficulty</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">Meeting Point</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedRide.detailedInfo.meetingPoint}</p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">Route Details</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedRide.detailedInfo.route}</p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">Pace Groups</h3>
                      <div className="space-y-2">
                        {selectedRide.detailedInfo.paceGroups.map((group: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-700">{group}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">What to Bring</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedRide.detailedInfo.whatToBring.map((item: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-900">Weather Policy</h3>
                        <p className="text-gray-700 leading-relaxed">{selectedRide.detailedInfo.weatherPolicy}</p>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-900">Contact</h3>
                        <p className="text-gray-700 leading-relaxed">{selectedRide.detailedInfo.contact}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">Route Highlights</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedRide.highlights.map((highlight: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-sm">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
