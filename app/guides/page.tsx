"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  BookOpen,
  Users,
  MapPin,
  Coffee,
  Heart,
  Trophy,
  Shield,
  Smartphone,
  Target,
  TrendingUp,
  Settings,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const guideData = {
  beginner: {
    icon: Heart,
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    sections: [
      {
        title: "How to Start",
        icon: Target,
        items: [
          "Learn basic bike handling and safety skills",
          "Understand Sydney road rules for cyclists",
          "Join beginner-friendly group rides or social cycling events",
          "Practice on flat, quiet routes before tackling busy roads",
        ],
      },
      {
        title: "Gear Recommendations",
        icon: Settings,
        items: [
          "Comfortable hybrid or entry-level road bike",
          "Helmet (mandatory)",
          "Basic repair kit (spare tube, pump, tire levers)",
          "Reflective clothing and lights for visibility",
        ],
      },
      {
        title: "Find a Club",
        icon: Users,
        items: [
          "Check out local beginner-friendly clubs in the app's Cycling Club Directory",
          "Join clubs with social rides focusing on learning and fun",
          "Use the app to message clubs or event organisers for intro rides",
        ],
      },
      {
        title: "Connect with Other Cyclists",
        icon: Heart,
        items: [
          "Create a profile and set your suburb in the app",
          "Join beginner-focused rides and meetups suggested in your Personalized Local Hub",
          "Participate in beginner forums or chat groups within the app",
        ],
      },
      {
        title: "Find Your Routes",
        icon: MapPin,
        items: [
          "Use the app's Rides & Routes Directory filtered for easy, low-traffic, flat routes",
          "Save beginner routes and coffee stops you like",
          "Download GPX files to your device or compatible GPS",
        ],
      },
    ],
  },
  intermediate: {
    icon: TrendingUp,
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    sections: [
      {
        title: "How to Continue Improving",
        icon: TrendingUp,
        items: [
          "Build endurance and learn pacing for longer rides",
          "Explore varied terrains like gentle hills and mixed surfaces",
          "Join structured training rides or paced group rides",
          "Learn basic bike maintenance and nutrition tips",
        ],
      },
      {
        title: "Gear Recommendations",
        icon: Settings,
        items: [
          "Upgrade to a lightweight road bike or gravel bike",
          "Cycling-specific clothing for comfort and aerodynamics",
          "Cycling computer or GPS device for tracking rides",
          "Multi-tool kit for on-the-go repairs",
        ],
      },
      {
        title: "Find a Club",
        icon: Users,
        items: [
          "Explore clubs offering intermediate and performance rides in the app",
          "Use filters to find rides by pace, distance, and terrain difficulty",
          "Attend workshops or social events hosted by clubs",
        ],
      },
      {
        title: "Connect with Other Cyclists",
        icon: Heart,
        items: [
          "Sync your Strava account to the app to share your progress",
          "Create and join rides through the app's Ride Creation & Social Connection feature",
          "Get matched with ride buddies of similar ability and goals",
        ],
      },
      {
        title: "Find Your Routes",
        icon: MapPin,
        items: [
          "Use the app's advanced filters to find routes with hills, longer distances, or mixed terrain",
          "Save favorite routes and discover new coffee stops and mechanic shops along the way",
          "Try rides recommended by local clubs or other users",
        ],
      },
    ],
  },
  advanced: {
    icon: Trophy,
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
    sections: [
      {
        title: "How to Advance Further",
        icon: Trophy,
        items: [
          "Focus on high-intensity training and race preparation",
          "Tackle challenging routes like KOM/QOM climbs or long endurance rides",
          "Consider coaching or join competitive cycling teams",
          "Maintain your bike meticulously and upgrade components as needed",
        ],
      },
      {
        title: "Gear Recommendations",
        icon: Settings,
        items: [
          "High-performance road or time trial bike",
          "Power meter and advanced cycling computer",
          "Aerodynamic clothing and helmet",
          "Comprehensive bike maintenance toolkit",
        ],
      },
      {
        title: "Find a Club",
        icon: Users,
        items: [
          "Connect with competitive clubs and teams via the app's club directory",
          "Join race training groups or long-distance endurance rides",
          "Attend cycling events, gran fondos, and races featured in the app",
        ],
      },
      {
        title: "Connect with Other Cyclists",
        icon: Heart,
        items: [
          "Use the app's social features to organize training rides or group challenges",
          "Share your routes and compete in challenges within the app community",
          "Network with elite cyclists and coaches",
        ],
      },
      {
        title: "Find Your Routes",
        icon: MapPin,
        items: [
          "Explore challenging and technical routes curated by elite riders and clubs",
          "Use detailed elevation profiles and segment info in the app",
          "Plan multi-day or touring rides with café stops and support points",
        ],
      },
    ],
  },
}

const appFeatures = [
  {
    title: "Set Your Suburb",
    description: "Personalize your feed for local routes, clubs, and coffee stops",
    icon: MapPin,
    color: "text-orange-600",
  },
  {
    title: "Browse & Save Routes",
    description: "Filter by difficulty and type, save favourites for offline use",
    icon: BookOpen,
    color: "text-blue-600",
  },
  {
    title: "Join Clubs & Rides",
    description: "Use the directory and ride creation tools to connect and plan rides",
    icon: Users,
    color: "text-green-600",
  },
  {
    title: "Get Tips & Guides",
    description: "Access expert advice and cycling news tailored to Sydney riders",
    icon: Shield,
    color: "text-purple-600",
  },
  {
    title: "Connect & Share",
    description: "Build your cycling network, share routes, and attend community events",
    icon: Heart,
    color: "text-red-600",
  },
]

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Cycling Guide for Sydney Riders</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Find the right info and resources for your cycling journey in Sydney, whether you're just starting out,
            building confidence, or looking to take your riding to the next level.
          </p>
        </div>

        {/* Skill Level Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {Object.entries(guideData).map(([level, data]) => {
            const IconComponent = data.icon
            return (
              <Card key={level} className={`${data.color} transition-all hover:shadow-lg`}>
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center`}>
                    <IconComponent className={`w-8 h-8 ${data.iconColor}`} />
                  </div>
                  <CardTitle className="text-2xl capitalize">{level} Cyclists</CardTitle>
                  <CardDescription className="text-base">
                    {level === "beginner" && "Perfect for those just starting their cycling journey"}
                    {level === "intermediate" && "Ready to take your cycling to the next level"}
                    {level === "advanced" && "For experienced riders seeking peak performance"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {data.sections.map((section, index) => {
                      const SectionIcon = section.icon
                      return (
                        <AccordionItem key={index} value={`${level}-section-${index}`} className="border-none">
                          <AccordionTrigger className="hover:no-underline py-3 px-0">
                            <div className="flex items-center gap-2">
                              <SectionIcon className={`w-5 h-5 ${data.iconColor}`} />
                              <h3 className="font-semibold text-lg text-left">{section.title}</h3>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 pt-2">
                            <ul className="space-y-2 ml-7">
                              {section.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-start gap-2 text-sm">
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${data.iconColor.replace("text-", "bg-")} mt-2 flex-shrink-0`}
                                  />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* How to Use the App Section */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-3">
              <Smartphone className="w-8 h-8 text-primary" />
              How to Use the App at Any Level
            </CardTitle>
            <CardDescription className="text-lg">
              Make the most of your Sydney cycling experience with these key features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {appFeatures.map((feature, index) => {
                const FeatureIcon = feature.icon
                return (
                  <AccordionItem key={index} value={`app-feature-${index}`} className="border-b">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4">
                        <FeatureIcon className={`w-6 h-6 ${feature.color}`} />
                        <div className="text-left">
                          <h3 className="font-semibold">{feature.title}</h3>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-2 ml-10">
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-8 border border-orange-200">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Sydney Cycling Journey?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of Sydney cyclists who are already using our platform to discover routes, connect with clubs,
            and find the perfect coffee stops for their rides.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <MapPin className="w-5 h-5 mr-2" />
              Explore Routes
            </Button>
            <Button size="lg" variant="outline">
              <Users className="w-5 h-5 mr-2" />
              Find Clubs
            </Button>
            <Button size="lg" variant="outline">
              <Coffee className="w-5 h-5 mr-2" />
              Discover Cafés
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
