import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coffee, Clock, MapPin, Star } from "lucide-react"
import Link from "next/link"

export function CoffeeSpots() {
  const coffeeSpots = [
    {
      name: "The Grounds of Alexandria",
      location: "Alexandria",
      rating: 4.8,
      openHours: "7:00 AM - 4:00 PM",
      bikeParking: "Excellent",
      specialties: ["Single Origin", "Pastries", "Weekend Brunch"],
      description:
        "Spacious courtyard perfect for group rides, with secure bike racks and cyclist-friendly atmosphere.",
      image: "/the-grounds-alexandria-cafe-cycling.png",
    },
    {
      name: "Pilu Kiosk",
      location: "Freshwater Beach",
      rating: 4.6,
      openHours: "6:30 AM - 3:00 PM",
      bikeParking: "Good",
      specialties: ["Beachside Views", "Fresh Juice", "Acai Bowls"],
      description: "Beachfront location with stunning ocean views, perfect stop on northern beaches rides.",
      image: "/pilu-kiosk-freshwater-beach-cafe.png",
    },
    {
      name: "Celsius Coffee",
      location: "Circular Quay",
      rating: 4.7,
      openHours: "6:00 AM - 5:00 PM",
      bikeParking: "Limited",
      specialties: ["Harbour Views", "Quick Service", "Takeaway"],
      description: "Prime harbour location with quick service for cyclists exploring the CBD and harbour bridge.",
      image: "/celsius-coffee-circular-quay.png",
    },
  ]

  const getParkingColor = (parking: string) => {
    switch (parking) {
      case "Excellent":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Good":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Limited":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <section id="coffee" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Best Coffee Stops</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fuel your rides at these cyclist-friendly cafés with great coffee, food, and bike parking.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {coffeeSpots.map((spot, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow p-0">
              <div className="aspect-video bg-muted">
                <img src={spot.image || "/placeholder.svg"} alt={spot.name} className="w-full h-full object-cover" />
              </div>

              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{spot.name}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-1">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{spot.location}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{spot.rating}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{spot.openHours}</span>
                    </div>
                  </div>
                  <Badge className={getParkingColor(spot.bikeParking)}>{spot.bikeParking}</Badge>
                </div>

                <CardDescription className="text-base leading-relaxed">{spot.description}</CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6 pt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Coffee className="w-4 h-4" />
                      <span>Specialties</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {spot.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs px-2 py-1">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button className="flex-1">View Details</Button>
                    <Button variant="outline" size="icon">
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/coffee">
            <Button size="lg" variant="outline">
              Explore All Coffee Stops
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
