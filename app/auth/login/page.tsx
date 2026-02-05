"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        // Redirect to hub page after successful login
        router.push("/hub")
      } else {
        setError(result.error || "Login failed")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const fillTestCredentials = (userType: 'admin' | 'user') => {
    if (userType === 'admin') {
      setEmail("admin@test.com")
      setPassword("TestPassword123!")
    } else {
      setEmail("testuser2@test.com")
      setPassword("TestPassword123!")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>
                Sign in to access your personalized cycling hub
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Test credentials - only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 space-y-3">
                  <div className="text-center text-sm text-muted-foreground">
                    Test Credentials
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillTestCredentials('admin')}
                      disabled={isLoading}
                    >
                      Admin User
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillTestCredentials('user')}
                      disabled={isLoading}
                    >
                      Regular User
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Click buttons above to auto-fill test credentials
                  </div>
                </div>
              )}

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <a href="/auth/signup" className="text-primary hover:underline">
                  Sign up
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Debug links - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">
                Other testing options:
              </div>
              <div className="space-x-2">
                <a 
                  href="/test-cognito" 
                  className="text-sm text-primary hover:underline"
                >
                  Test Cognito Page
                </a>
                <span className="text-muted-foreground">•</span>
                <a 
                  href="/debug-auth" 
                  className="text-sm text-primary hover:underline"
                >
                  Debug Auth
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}