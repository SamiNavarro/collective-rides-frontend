"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Coffee, MapPin, Clock, Bike, Star, Phone, ExternalLink, Search, Filter, X, ChevronDown } from "lucide-react"
import Image from "next/image"

export default function CoffeePage() {
  const [useDropdownMode, setUseDropdownMode] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [areaValue, setAreaValue] = useState("")
  const [bikeParkingValue, setBikeParkingValue] = useState("")

  const filtersRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const checkFiltersLayout = useCallback(() => {
    if (!filtersRef.current) return

    const container = filtersRef.current
    const containerWidth = container.offsetWidth
    const searchInput = container.querySelector("input")
    const searchWidth = searchInput ? searchInput.offsetWidth : 200

    // Calculate space needed for filters (2 filters × 180px + gaps)
    const filterWidth = 180
    const minSpaceNeeded = filterWidth * 2 + 32 // 2 filters + gaps
    const availableSpace = containerWidth - searchWidth - 48 // Account for padding and gaps

    // Use breakpoint-based logic with space calculation
    const shouldUseDropdown = window.innerWidth < 1024 && availableSpace < minSpaceNeeded

    setUseDropdownMode(shouldUseDropdown)
  }, [])

  useEffect(() => {
    const debouncedCheck = debounce(checkFiltersLayout, 50)

    // Initial check
    checkFiltersLayout()

    // ResizeObserver for container changes
    if (filtersRef.current) {
      resizeObserverRef.current = new ResizeObserver(debouncedCheck)
      resizeObserverRef.current.observe(filtersRef.current)
    }

    // Window resize listener for breakpoint changes
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
    if (bikeParkingValue && bikeParkingValue !== "all") count++
    return count
  }

  const clearAllFilters = () => {
    setAreaValue("")
    setBikeParkingValue("")
  }

  const getActiveFilterBadges = () => {
    const badges = []
    if (areaValue && areaValue !== "all") {
      badges.push({ key: "area", label: `Area: ${areaValue}`, clear: () => setAreaValue("") })
    }
    if (bikeParkingValue && bikeParkingValue !== "all") {
      badges.push({ key: "parking", label: `Parking: ${bikeParkingValue}`, clear: () => setBikeParkingValue("") })
    }
    return badges
  }

  const coffeeShops = [
    {
      name: "The Grounds of Alexandria",
      area: "Alexandria",
      rating: 4.8,
      bikeParking: "Excellent",
      hours: "7:00 AM - 4:00 PM",
      specialty: "Artisan Coffee & Brunch",
      phone: "(02) 9699 2225",
      address: "2 Huntley St, Alexandria",
      features: ["Bike Racks", "Outdoor Seating", "WiFi", "Large Groups Welcome"],
      description: "Iconic Sydney café with excellent bike parking and cyclist-friendly atmosphere.",
      image: "/the-grounds-alexandria-cafe-cycling.png",
    },
    {
      name: "Campos Coffee",
      area: "Multiple Locations",
      rating: 4.6,
      bikeParking: "Good",
      hours: "6:30 AM - 3:00 PM",
      specialty: "Superior Blend Coffee",
      phone: "(02) 9698 2598",
      address: "Various locations",
      features: ["Quick Service", "Takeaway", "Bike Friendly"],
      description: "Sydney's premium coffee roaster with multiple cyclist-friendly locations.",
      image: "/campos-coffee-sydney-cycling.png",
    },
    {
      name: "Bondi Beach Public Bar",
      area: "Bondi",
      rating: 4.5,
      bikeParking: "Good",
      hours: "7:00 AM - 11:00 PM",
      specialty: "Beachside Café",
      phone: "(02) 9130 3120",
      address: "1 Notts Ave, Bondi Beach",
      features: ["Beach Views", "Bike Racks", "All Day Menu"],
      description: "Perfect stop after coastal rides with secure bike parking.",
      image: "/bondi-beach-cafe-cycling.png",
    },
    {
      name: "Reuben Hills",
      area: "Surry Hills",
      rating: 4.7,
      bikeParking: "Excellent",
      hours: "7:00 AM - 4:00 PM",
      specialty: "Single Origin Coffee",
      phone: "(02) 8068 8370",
      address: "61 Albion St, Surry Hills",
      features: ["Roastery", "Bike Racks", "WiFi", "Specialty Beans"],
      description: "Award-winning roastery with dedicated cyclist facilities.",
      image: "/reuben-hills-surry-hills-cafe.png",
    },
    {
      name: "Barefoot Coffee Traders",
      area: "Manly",
      rating: 4.4,
      bikeParking: "Good",
      hours: "6:00 AM - 5:00 PM",
      specialty: "Beachside Coffee",
      phone: "(02) 9977 3779",
      address: "Shop 1/49 East Esplanade, Manly",
      features: ["Beach Location", "Bike Parking", "Quick Service"],
      description: "Beachfront café perfect for Northern Beaches cycling routes.",
      image: "/barefoot-coffee-manly-beach.png",
    },
    {
      name: "Single O",
      area: "Surry Hills",
      rating: 4.6,
      bikeParking: "Excellent",
      hours: "7:00 AM - 4:00 PM",
      specialty: "Specialty Coffee",
      phone: "(02) 9211 0665",
      address: "60-64 Reservoir St, Surry Hills",
      features: ["Roastery", "Bike Racks", "Industrial Vibe", "WiFi"],
      description: "Industrial-chic roastery with excellent cyclist amenities.",
      image: "/single-o-surry-hills-roastery.png",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Coffee className="h-8 w-8 text-amber-600" />
            <h1 className="text-4xl font-bold text-gray-900">Bike-Friendly Coffee Stops</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover Sydney's best cyclist-friendly cafés with secure bike parking, quick service, and the perfect fuel
            for your next ride.
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
                  placeholder="Search coffee shops..."
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
                  <Select value={bikeParkingValue} onValueChange={setBikeParkingValue}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Bike Parking" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Parking</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
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
                          <label className="text-sm font-medium mb-1 block">Bike Parking</label>
                          <Select value={bikeParkingValue} onValueChange={setBikeParkingValue}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Parking" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Parking</SelectItem>
                              <SelectItem value="excellent">Excellent</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
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

        {/* Coffee Shops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {coffeeShops.map((shop, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden p-0">
              <div className="relative h-48 w-full">
                <Image
                  src={shop.image || "/placeholder.svg"}
                  alt={`${shop.name} - cyclist-friendly café`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{shop.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {shop.area}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{shop.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={shop.bikeParking === "Excellent" ? "default" : "secondary"}>
                    <Bike className="h-3 w-3 mr-1" />
                    {shop.bikeParking} Parking
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {shop.hours.split(" - ")[0]}
                  </div>
                </div>

                <p className="text-sm text-gray-600">{shop.description}</p>

                <div className="space-y-2">
                  <p className="text-sm font-medium">{shop.specialty}</p>
                  <div className="flex flex-wrap gap-1">
                    {shop.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {shop.phone}
                  </div>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coffee Etiquette Section */}
        <Card className="mb-8 p-0">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-amber-600" />
              Cyclist Coffee Etiquette
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-700">Do's</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Secure your bike properly in designated areas</li>
                  <li>• Remove helmet and gloves when ordering</li>
                  <li>• Be patient during busy periods</li>
                  <li>• Support cafés that welcome cyclists</li>
                  <li>• Clean up after yourself</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-red-700">Don'ts</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Block pedestrian walkways with bikes</li>
                  <li>• Enter in large, disruptive groups</li>
                  <li>• Expect special treatment</li>
                  <li>• Leave bikes unattended for long periods</li>
                  <li>• Ignore café-specific bike parking rules</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-8 border border-orange-200">
          <h3 className="text-2xl font-bold mb-4">Know a Great Cyclist-Friendly Café?</h3>
          <p className="mb-6 text-muted-foreground">
            Help fellow cyclists discover new coffee stops by sharing your recommendations.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            Suggest a Café
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
