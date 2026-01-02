"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Menu,
  X,
  MapPin,
  Coffee,
  Users,
  BookOpen,
  User,
  Settings,
  LogOut,
  Calendar,
  Heart,
  Activity,
  Shield,
  Database,
  BarChart3,
  UserCheck,
  Navigation,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AuthDialog } from "./auth/auth-dialog"
import Link from "next/link"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const { user, logout, getAdminClubs, isSiteAdmin, canManageClub, canManageRides, canLeadRides } = useAuth()

  const handleAuthClick = (mode: "login" | "signup") => {
    setAuthMode(mode)
    setAuthDialogOpen(true)
  }

  const closeMobileMenu = () => {
    setIsMenuOpen(false)
  }

  const hasClubAdminAccess = user && getAdminClubs().length > 0
  const hasSiteAdminAccess = user && isSiteAdmin()
  const hasRideCaptainAccess = user && user.joinedClubs && user.joinedClubs.some((club) => club.role === "ride_captain")
  const hasRideLeaderAccess = user && user.joinedClubs && user.joinedClubs.some((club) => club.role === "ride_leader")

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Collective Rides</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/routes"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>Routes</span>
              </Link>
              <Link
                href="/coffee"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Coffee className="w-4 h-4" />
                <span>Coffee</span>
              </Link>
              <Link
                href="/clubs"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Clubs</span>
              </Link>
              <Link
                href="/guides"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Guides</span>
              </Link>
              {user && (
                <>
                  <Link
                    href="/hub"
                    className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    <User className="w-4 h-4" />
                    <span>My Hub</span>
                  </Link>
                  <Link
                    href="/my-clubs"
                    className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    <Users className="w-4 h-4" />
                    <span>My Clubs</span>
                  </Link>
                  <Link
                    href="/rides"
                    className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>My Rides</span>
                  </Link>
                  {hasSiteAdminAccess && (
                    <Link
                      href="/admin/site"
                      className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors font-medium"
                    >
                      <Database className="w-4 h-4" />
                      <span>Site Admin</span>
                    </Link>
                  )}
                  {hasClubAdminAccess && !hasSiteAdminAccess && (
                    <Link
                      href="/admin/clubs"
                      className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors font-medium"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Club Admin</span>
                    </Link>
                  )}
                  {hasRideCaptainAccess && !hasClubAdminAccess && !hasSiteAdminAccess && (
                    <Link
                      href="/captain/profile"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Captain</span>
                    </Link>
                  )}
                </>
              )}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-blue-600 font-medium">
                          {hasSiteAdminAccess
                            ? "Site Administrator"
                            : hasClubAdminAccess
                              ? "Club Administrator"
                              : hasRideCaptainAccess
                                ? "Ride Captain"
                                : hasRideLeaderAccess
                                  ? "Ride Leader"
                                  : "Rider"}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/hub">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Hub</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-clubs">
                        <Users className="mr-2 h-4 w-4" />
                        <span>My Clubs</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/rides">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>My Rides</span>
                      </Link>
                    </DropdownMenuItem>
                    {(hasSiteAdminAccess || hasClubAdminAccess || hasRideCaptainAccess) && (
                      <>
                        <DropdownMenuSeparator />
                        {hasSiteAdminAccess && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/admin/site">
                                <Database className="mr-2 h-4 w-4" />
                                <span>Site Administration</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/admin/site/users">
                                <UserCheck className="mr-2 h-4 w-4" />
                                <span>User Management</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/admin/site/analytics">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                <span>Analytics</span>
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        {hasClubAdminAccess && !hasSiteAdminAccess && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin/clubs">
                              <Shield className="mr-2 h-4 w-4" />
                              <span>Club Administration</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {hasRideCaptainAccess && !hasClubAdminAccess && !hasSiteAdminAccess && (
                          <DropdownMenuItem asChild>
                            <Link href="/captain/profile">
                              <Navigation className="mr-2 h-4 w-4" />
                              <span>Captain Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Favorites</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/activity">
                        <Activity className="mr-2 h-4 w-4" />
                        <span>Activity</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => handleAuthClick("login")}>
                    Sign In
                  </Button>
                  <Button onClick={() => handleAuthClick("signup")}>Join Community</Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="border-t bg-background/95 backdrop-blur">
                <nav className="container mx-auto px-4 py-6">
                  {/* Main Navigation Links */}
                  <div className="space-y-1 mb-6">
                    <Link
                      href="/routes"
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                      onClick={closeMobileMenu}
                    >
                      <MapPin className="w-5 h-5" />
                      <span>Routes</span>
                    </Link>
                    <Link
                      href="/coffee"
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                      onClick={closeMobileMenu}
                    >
                      <Coffee className="w-5 h-5" />
                      <span>Coffee</span>
                    </Link>
                    <Link
                      href="/clubs"
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                      onClick={closeMobileMenu}
                    >
                      <Users className="w-5 h-5" />
                      <span>Clubs</span>
                    </Link>
                    <Link
                      href="/guides"
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                      onClick={closeMobileMenu}
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>Guides</span>
                    </Link>
                  </div>

                  {/* User Section */}
                  {user ? (
                    <>
                      <div className="border-t pt-6 mb-6">
                        <div className="flex items-center space-x-3 px-3 py-2 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-base font-semibold text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{user.email}</p>
                            <p className="text-xs text-blue-600 font-medium">
                              {hasSiteAdminAccess
                                ? "Site Administrator"
                                : hasClubAdminAccess
                                  ? "Club Administrator"
                                  : hasRideCaptainAccess
                                    ? "Ride Captain"
                                    : hasRideLeaderAccess
                                      ? "Ride Leader"
                                      : "Rider"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 mb-6">
                          <Link
                            href="/hub"
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-primary hover:text-primary/80 hover:bg-primary/5 transition-all duration-200"
                            onClick={closeMobileMenu}
                          >
                            <User className="w-5 h-5" />
                            <span>My Hub</span>
                          </Link>
                          <Link
                            href="/my-clubs"
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-primary hover:text-primary/80 hover:bg-primary/5 transition-all duration-200"
                            onClick={closeMobileMenu}
                          >
                            <Users className="w-5 h-5" />
                            <span>My Clubs</span>
                          </Link>
                          <Link
                            href="/rides"
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-primary hover:text-primary/80 hover:bg-primary/5 transition-all duration-200"
                            onClick={closeMobileMenu}
                          >
                            <Calendar className="w-5 h-5" />
                            <span>My Rides</span>
                          </Link>
                          {hasSiteAdminAccess && (
                            <>
                              <Link
                                href="/admin/site"
                                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                                onClick={closeMobileMenu}
                              >
                                <Database className="w-5 h-5" />
                                <span>Site Administration</span>
                              </Link>
                              <Link
                                href="/admin/site/users"
                                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                                onClick={closeMobileMenu}
                              >
                                <UserCheck className="w-5 h-5" />
                                <span>User Management</span>
                              </Link>
                              <Link
                                href="/admin/site/analytics"
                                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                                onClick={closeMobileMenu}
                              >
                                <BarChart3 className="w-5 h-5" />
                                <span>Analytics</span>
                              </Link>
                            </>
                          )}
                          {hasClubAdminAccess && !hasSiteAdminAccess && (
                            <Link
                              href="/admin/clubs"
                              className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200"
                              onClick={closeMobileMenu}
                            >
                              <Shield className="w-5 h-5" />
                              <span>Club Administration</span>
                            </Link>
                          )}
                          {hasRideCaptainAccess && !hasClubAdminAccess && !hasSiteAdminAccess && (
                            <Link
                              href="/captain/profile"
                              className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
                              onClick={closeMobileMenu}
                            >
                              <Navigation className="w-5 h-5" />
                              <span>Captain Dashboard</span>
                            </Link>
                          )}
                        </div>

                        <div className="border-t pt-4">
                          <button
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-destructive hover:text-destructive/80 hover:bg-destructive/5 transition-all duration-200 w-full"
                            onClick={() => {
                              logout()
                              closeMobileMenu()
                            }}
                          >
                            <LogOut className="w-5 h-5" />
                            <span>Log out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-t pt-6 space-y-3">
                        <Button
                          variant="ghost"
                          size="lg"
                          className="w-full justify-start text-base font-medium h-12"
                          onClick={() => {
                            handleAuthClick("login")
                            closeMobileMenu()
                          }}
                        >
                          Sign In
                        </Button>
                        <Button
                          size="lg"
                          className="w-full justify-start text-base font-medium h-12"
                          onClick={() => {
                            handleAuthClick("signup")
                            closeMobileMenu()
                          }}
                        >
                          Join Community
                        </Button>
                      </div>
                    </>
                  )}
                </nav>
              </div>
            </div>
          )}
        </div>
      </header>

      <AuthDialog isOpen={authDialogOpen} onClose={() => setAuthDialogOpen(false)} initialMode={authMode} />
    </>
  )
}
