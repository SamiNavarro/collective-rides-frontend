"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { cognitoAuth } from "@/lib/auth/cognito-service"
import { api } from "@/lib/api/api-client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DebugAuthPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [diagnostics, setDiagnostics] = useState<any>({})
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setTesting(true)
    const results: any = {}

    try {
      // 1. Check environment variables
      results.environment = {
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
      }

      // 2. Check Cognito authentication
      results.cognito = {
        isAuthenticated: cognitoAuth.isAuthenticated(),
        currentUser: null,
        tokens: null,
      }

      if (cognitoAuth.isAuthenticated()) {
        try {
          results.cognito.currentUser = await cognitoAuth.getCurrentUser()
          results.cognito.tokens = {
            hasAccessToken: !!(await cognitoAuth.getAccessToken()),
            accessTokenLength: (await cognitoAuth.getAccessToken())?.length || 0,
          }
        } catch (error) {
          results.cognito.error = error.message
        }
      }

      // 3. Test API connectivity
      results.api = {}
      
      try {
        const healthCheck = await api.health()
        results.api.health = healthCheck
      } catch (error) {
        results.api.healthError = error.message
      }

      // 4. Test authenticated API calls
      if (cognitoAuth.isAuthenticated()) {
        try {
          const userProfile = await api.user.getCurrent()
          results.api.userProfile = userProfile
        } catch (error) {
          results.api.userProfileError = error.message
        }

        try {
          const memberships = await api.user.getMemberships()
          results.api.memberships = memberships
        } catch (error) {
          results.api.membershipsError = error.message
        }
      }

      // 5. Check auth context state
      results.authContext = {
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          siteRole: user.siteRole,
          joinedClubsCount: user.joinedClubs?.length || 0,
        } : null,
        isLoading,
        isAuthenticated,
      }

    } catch (error) {
      results.error = error.message
    }

    setDiagnostics(results)
    setTesting(false)
  }

  const clearAuthAndReload = async () => {
    await cognitoAuth.signOut()
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  const testDirectApiCall = async () => {
    const accessToken = await cognitoAuth.getAccessToken()
    if (!accessToken) {
      alert('No access token available')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      alert(`Direct API Call Result:\nStatus: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      alert(`Direct API Call Error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Authentication Diagnostics</h1>
            <p className="text-muted-foreground">Debug authentication issues in production</p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={runDiagnostics} disabled={testing}>
              {testing ? 'Running Diagnostics...' : 'Refresh Diagnostics'}
            </Button>
            <Button variant="outline" onClick={testDirectApiCall}>
              Test Direct API Call
            </Button>
            <Button variant="destructive" onClick={clearAuthAndReload}>
              Clear Auth & Reload
            </Button>
          </div>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
              <CardDescription>Check if all required environment variables are set</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnostics.environment && Object.entries(diagnostics.environment).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">{key}:</span>
                    <Badge variant={value ? "default" : "destructive"}>
                      {value ? "✓ Set" : "✗ Missing"}
                    </Badge>
                  </div>
                ))}
              </div>
              {diagnostics.environment && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(diagnostics.environment, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cognito Status */}
          <Card>
            <CardHeader>
              <CardTitle>Cognito Authentication</CardTitle>
              <CardDescription>AWS Cognito authentication status and user data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="font-medium">Authenticated:</span>
                  <Badge variant={diagnostics.cognito?.isAuthenticated ? "default" : "destructive"}>
                    {diagnostics.cognito?.isAuthenticated ? "✓ Yes" : "✗ No"}
                  </Badge>
                </div>
                
                {diagnostics.cognito?.currentUser && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Cognito User Data:</h4>
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(diagnostics.cognito.currentUser, null, 2)}
                    </pre>
                  </div>
                )}

                {diagnostics.cognito?.tokens && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Token Status:</h4>
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(diagnostics.cognito.tokens, null, 2)}
                    </pre>
                  </div>
                )}

                {diagnostics.cognito?.error && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <h4 className="font-medium text-destructive mb-2">Cognito Error:</h4>
                    <p className="text-sm">{diagnostics.cognito.error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle>Backend API Status</CardTitle>
              <CardDescription>Test connectivity and authentication with backend API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Health Check */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Health Check:</h4>
                  {diagnostics.api?.health ? (
                    <div className="space-y-2">
                      <Badge variant={diagnostics.api.health.success ? "default" : "destructive"}>
                        {diagnostics.api.health.success ? "✓ API Healthy" : "✗ API Error"}
                      </Badge>
                      <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(diagnostics.api.health, null, 2)}
                      </pre>
                    </div>
                  ) : diagnostics.api?.healthError ? (
                    <div className="text-destructive text-sm">
                      Error: {diagnostics.api.healthError}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">Not tested</div>
                  )}
                </div>

                {/* User Profile */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">User Profile API:</h4>
                  {diagnostics.api?.userProfile ? (
                    <div className="space-y-2">
                      <Badge variant={diagnostics.api.userProfile.success ? "default" : "destructive"}>
                        {diagnostics.api.userProfile.success ? "✓ Profile Loaded" : "✗ Profile Error"}
                      </Badge>
                      <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(diagnostics.api.userProfile, null, 2)}
                      </pre>
                    </div>
                  ) : diagnostics.api?.userProfileError ? (
                    <div className="text-destructive text-sm">
                      Error: {diagnostics.api.userProfileError}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">Not tested (not authenticated)</div>
                  )}
                </div>

                {/* Memberships */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Memberships API:</h4>
                  {diagnostics.api?.memberships ? (
                    <div className="space-y-2">
                      <Badge variant={diagnostics.api.memberships.success ? "default" : "destructive"}>
                        {diagnostics.api.memberships.success ? "✓ Memberships Loaded" : "✗ Memberships Error"}
                      </Badge>
                      <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(diagnostics.api.memberships, null, 2)}
                      </pre>
                    </div>
                  ) : diagnostics.api?.membershipsError ? (
                    <div className="text-destructive text-sm">
                      Error: {diagnostics.api.membershipsError}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">Not tested (not authenticated)</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auth Context */}
          <Card>
            <CardHeader>
              <CardTitle>Auth Context State</CardTitle>
              <CardDescription>Current state of the authentication context</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">Loading:</span>
                    <Badge variant={diagnostics.authContext?.isLoading ? "secondary" : "default"}>
                      {diagnostics.authContext?.isLoading ? "⏳ Loading" : "✓ Complete"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">Authenticated:</span>
                    <Badge variant={diagnostics.authContext?.isAuthenticated ? "default" : "destructive"}>
                      {diagnostics.authContext?.isAuthenticated ? "✓ Yes" : "✗ No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">User Data:</span>
                    <Badge variant={diagnostics.authContext?.user ? "default" : "destructive"}>
                      {diagnostics.authContext?.user ? "✓ Loaded" : "✗ Missing"}
                    </Badge>
                  </div>
                </div>

                {diagnostics.authContext?.user && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">User Context Data:</h4>
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(diagnostics.authContext.user, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Raw Diagnostics */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Diagnostics Data</CardTitle>
              <CardDescription>Complete diagnostic information for debugging</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}