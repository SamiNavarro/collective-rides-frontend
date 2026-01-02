import { Button } from "@/components/ui/button"
import { MapPin, Coffee, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Your Sydney Cycling
            <span className="text-primary block">Adventure Starts Here</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover the best routes, coffee stops, and cycling communities across Sydney. From harbour loops to hill
            climbs, we've got your next ride covered.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/routes">
              <Button size="lg" className="text-lg px-8">
                Explore Routes
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/coffee">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Find Coffee Stops
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">150+ Routes</h3>
              <p className="text-sm text-muted-foreground text-center">Coastal, hills, parks & gravel</p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Coffee className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">80+ Cafés</h3>
              <p className="text-sm text-muted-foreground text-center">Bike-friendly coffee stops</p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">20+ Clubs</h3>
              <p className="text-sm text-muted-foreground text-center">Find your cycling community</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
