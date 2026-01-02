import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FeaturesGrid } from "@/components/features-grid"
import { PopularRoutes } from "@/components/popular-routes"
import { CoffeeSpots } from "@/components/coffee-spots"
import { CyclingClubs } from "@/components/cycling-clubs"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <FeaturesGrid />
      <PopularRoutes />
      <CoffeeSpots />
      <CyclingClubs />
      <Footer />
    </div>
  )
}
