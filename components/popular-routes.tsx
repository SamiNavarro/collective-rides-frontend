import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, TrendingUp, Download, Coffee } from "lucide-react"
import Link from "next/link"

export function PopularRoutes() {
  const routes = [
    {
      name: "Harbour Bridge Loop",
      distance: "25km",
      elevation: "180m",
      time: "1.5 hours",
      difficulty: "Easy",
      type: "Coastal",
      description: "Iconic Sydney harbour views with minimal climbing. Perfect for beginners and tourists.",
      coffeeStops: ["The Grounds", "Celsius Coffee"],
      image: "/sydney-harbour-bridge-cycling.png",
    },
    {
      name: "Manly to Palm Beach",
      distance: "45km",
      elevation: "320m",
      time: "2.5 hours",
      difficulty: "Moderate",
      type: "Coastal",
      description: "Stunning northern beaches coastline with rolling hills and beach cafés.",
      coffeeStops: ["Pilu Kiosk", "Boathouse Palm Beach"],
      image: "/manly-palm-beach-cycle.png",
    },
    {
      name: "Royal National Park",
      distance: "60km",
      elevation: "850m",
      time: "3.5 hours",
      difficulty: "Hard",
      type: "Hills",
      description: "Challenging climbs through Australia's oldest national park with rainforest views.",
      coffeeStops: ["Audley Boatshed", "Bundeena Café"],
      image: "/royal-national-park-cycling-hills.png",
    },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Moderate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <section id="routes" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Popular Routes</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with these crowd favorites, from easy harbour loops to challenging hill climbs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {routes.map((route, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow p-0">
              <div className="aspect-[4/3] bg-muted">
                <img src={route.image || "/placeholder.svg"} alt={route.name} className="w-full h-full object-cover" />
              </div>

              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{route.name}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{route.distance}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{route.elevation}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{route.time}</span>
                      </span>
                    </div>
                  </div>
                  <Badge className={getDifficultyColor(route.difficulty)}>{route.difficulty}</Badge>
                </div>

                <CardDescription className="text-base leading-relaxed">{route.description}</CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6 pt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Coffee className="w-4 h-4" />
                      <span>Coffee Stops</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {route.coffeeStops.map((stop, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs px-2 py-1">
                          {stop}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button className="flex-1">View Route</Button>
                    <Button variant="outline" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/routes">
            <Button size="lg" variant="outline">
              Browse All Routes
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
