"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Zap } from "lucide-react"

interface CreateRideDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateRide: (rideData: any) => void
}

const stravaRoutes = [
  {
    id: 1,
    name: "Morning Harbour Loop",
    distance: "25.3km",
    elevation: "245m",
    difficulty: "Moderate",
    description: "Popular harbour bridge route with city views",
  },
  {
    id: 2,
    name: "Coastal Cruise",
    distance: "18.7km",
    elevation: "120m",
    difficulty: "Easy",
    description: "Scenic coastal ride from Bondi to Coogee",
  },
  {
    id: 3,
    name: "Blue Mountains Climb",
    distance: "42.1km",
    elevation: "890m",
    difficulty: "Hard",
    description: "Challenging mountain climb with stunning views",
  },
]

export function CreateRideDialog({ isOpen, onClose, onCreateRide }: CreateRideDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    distance: "",
    pace: "",
    difficulty: "",
    maxAttendees: "",
    route: "",
  })
  const [selectedStravaRoute, setSelectedStravaRoute] = useState<(typeof stravaRoutes)[0] | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const rideData = selectedStravaRoute
      ? {
          ...formData,
          title: formData.title || selectedStravaRoute.name,
          distance: selectedStravaRoute.distance,
          difficulty: selectedStravaRoute.difficulty,
          route: selectedStravaRoute.description,
        }
      : formData

    onCreateRide(rideData)
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      distance: "",
      pace: "",
      difficulty: "",
      maxAttendees: "",
      route: "",
    })
    setSelectedStravaRoute(null)
  }

  const handleStravaRouteSelect = (route: (typeof stravaRoutes)[0]) => {
    setSelectedStravaRoute(route)
    setFormData({
      ...formData,
      title: route.name,
      distance: route.distance,
      difficulty: route.difficulty,
      route: route.description,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Ride</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="strava">Import from Strava</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Ride Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Morning Harbour Bridge Loop"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Starting Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Circular Quay"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your ride, what to expect, coffee stops, etc."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance</Label>
                  <Input
                    id="distance"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    placeholder="25km"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pace">Pace</Label>
                  <Select value={formData.pace} onValueChange={(value) => setFormData({ ...formData, pace: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pace" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Leisurely">Leisurely</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                  placeholder="12"
                  min="2"
                  max="50"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Create Ride</Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="strava" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Zap className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">Strava Connected</p>
                  <p className="text-sm text-orange-600">Import your favorite routes directly from Strava</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Your Recent Routes</h3>
                {stravaRoutes.map((route) => (
                  <Card
                    key={route.id}
                    className={`cursor-pointer transition-colors ${
                      selectedStravaRoute?.id === route.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleStravaRouteSelect(route)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{route.name}</h4>
                        <Badge
                          variant={
                            route.difficulty === "Easy"
                              ? "secondary"
                              : route.difficulty === "Moderate"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {route.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{route.description}</p>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {route.distance}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {route.elevation} elevation
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedStravaRoute && (
                <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Ride Details</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="strava-date">Date</Label>
                      <Input
                        id="strava-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="strava-time">Start Time</Label>
                      <Input
                        id="strava-time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strava-location">Meeting Point</Label>
                    <Input
                      id="strava-location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Where should riders meet?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strava-pace">Pace</Label>
                    <Select value={formData.pace} onValueChange={(value) => setFormData({ ...formData, pace: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pace" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Leisurely">Leisurely</SelectItem>
                        <SelectItem value="Social">Social</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Ride from Strava</Button>
                  </div>
                </form>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
