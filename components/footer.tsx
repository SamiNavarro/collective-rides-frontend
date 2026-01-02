import { MapPin, Coffee, Users, BookOpen, Mail, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Collective Rides</span>
            </div>
            <p className="text-muted-foreground">
              Your one-stop hub for Sydney cycling adventures. Discover routes, coffee stops, and connect with the
              community.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Explore</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#routes"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Routes & Maps</span>
                </a>
              </li>
              <li>
                <a
                  href="#coffee"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Coffee className="w-4 h-4" />
                  <span>Coffee Stops</span>
                </a>
              </li>
              <li>
                <a
                  href="#clubs"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Cycling Clubs</span>
                </a>
              </li>
              <li>
                <a
                  href="#guides"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Tips & Guides</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Resources</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Beginner's Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Safety Tips
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Event Calendar
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Route Planning
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Bike Maintenance
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Get in Touch</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:hello@collectiverides.com"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>hello@collectiverides.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+61234567890"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>+61 2 3456 7890</span>
                </a>
              </li>
            </ul>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Join our community of Sydney cyclists and discover your next adventure.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Collective Rides. Made with ❤️ for the Sydney cycling community.</p>
        </div>
      </div>
    </footer>
  )
}
