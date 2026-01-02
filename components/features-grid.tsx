import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Coffee, Users, BookOpen, Star } from "lucide-react"

export function FeaturesGrid() {
  const features = [
    {
      icon: MapPin,
      title: "Routes & Maps",
      description: "Discover coastal loops, hill climbs, and park circuits with detailed maps and GPX downloads.",
      highlights: ["Distance & elevation", "Difficulty ratings", "GPX downloads", "Turn-by-turn directions"],
    },
    {
      icon: Coffee,
      title: "Coffee Stop Guide",
      description: "Find the best bike-friendly cafés with opening hours, menu highlights, and parking info.",
      highlights: ["Opening hours", "Bike parking", "Menu favorites", "Rider reviews"],
    },
    {
      icon: Users,
      title: "Cycling Clubs",
      description: "Connect with 20+ Sydney cycling clubs and find your perfect riding community.",
      highlights: ["Club profiles", "Ride schedules", "Pace groups", "Beginner-friendly options"],
    },
    {
      icon: BookOpen,
      title: "Tips & Guides",
      description: "Learn cycling safety, etiquette, and discover Sydney's hidden cycling gems.",
      highlights: ["Safety tips", "Group ride etiquette", "Local insights", "Event calendar"],
    },
  ]

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Everything You Need to Ride Sydney</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From first-time riders to seasoned bunch riders, we've got the tools and community to enhance your cycling
            experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 text-primary" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
