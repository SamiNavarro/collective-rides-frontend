"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestCognitoInitPage() {
  const [testResults, setTestResults] = useState<any>({})
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    const results: any = {}

    try {
      // Test 1: Check environment variables
      results.envCheck = {
        apiUrl: !!process.env.NEXT_PUBLIC_API_URL,
        region: !!process.env.NEXT_PUBLIC_AWS_REGION,
        userPoolId: !!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        clientId: !!process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      }

      // Test 2: Try to import Cognito service
      try {
        const { cognitoAuth } = await import('@/lib/auth/cognito-service')
        results.cognitoImport = { success: true, service: !!cognitoAuth }
        
        // Test 3: Try to check authentication status
        try {
          const isAuth = cognitoAuth.isAuthenticated()
          results.authCheck = { success: true, isAuthenticated: isAuth }
        } catch (error) {
          results.authCheck = { success: false, error: error.message }
        }

        // Test 4: Try to get current user (should be null if not authenticated)
        try {
          const user = await cognitoAuth.getCurrentUser()
          results.userCheck = { success: true, user: user }
        } catch (error) {
          results.userCheck = { success: false, error: error.message }
        }

        // Test 5: Try a test login
        try {
          const loginResult = await cognitoAuth.signIn('admin@test.com', 'TestPassword123!')
          results.loginTest = { 
            success: loginResult.success, 
            message: loginResult.message,
            hasTokens: !!loginResult.tokens
          }

          // If login successful, test getting user again
          if (loginResult.success) {
            try {
              const userAfterLogin = await cognitoAuth.getCurrentUser()
              results.userAfterLogin = { success: true, user: userAfterLogin }
            } catch (error) {
              results.userAfterLogin = { success: false, error: error.message }
            }
          }
        } catch (error) {
          results.loginTest = { success: false, error: error.message }
        }

      } catch (error) {
        results.cognitoImport = { success: false, error: error.message }
      }

      // Test 6: Try to import API client
      try {
        const { api } = await import('@/lib/api/api-client')
        results.apiImport = { success: true, client: !!api }

        // Test health check
        try {
          const health = await api.health()
          results.healthCheck = health
        } catch (error) {
          results.healthCheck = { success: false, error: error.message }
        }
      } catch (error) {
        results.apiImport = { success: false, error: error.message }
      }

    } catch (error) {
      results.generalError = error.message
    }

    setTestResults(results)
    setTesting(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusBadge = (success: boolean) => (
    <Badge variant={success ? "default" : "destructive"}>
      {success ? "✓ Pass" : "✗ Fail"}
    </Badge>
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Cognito Service Initialization Test</h1>
            <p className="text-muted-foreground">Test if Cognito authentication service can be initialized and used</p>
          </div>

          <div className="flex justify-center">
            <Button onClick={runTests} disabled={testing}>
              {testing ? 'Running Tests...' : 'Refresh Tests'}
            </Button>
          </div>

          {/* Environment Check */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>Check if all required environment variables are available</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.envCheck && (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(testResults.envCheck).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-2 border rounded">
                      <span>{key}:</span>
                      {getStatusBadge(value as boolean)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cognito Import */}
          <Card>
            <CardHeader>
              <CardTitle>Cognito Service Import</CardTitle>
              <CardDescription>Test if the Cognito service can be imported and initialized</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.cognitoImport && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Import Success:</span>
                    {getStatusBadge(testResults.cognitoImport.success)}
                  </div>
                  {testResults.cognitoImport.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{testResults.cognitoImport.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Authentication Check */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status Check</CardTitle>
              <CardDescription>Test if we can check authentication status</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.authCheck && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Status Check:</span>
                    {getStatusBadge(testResults.authCheck.success)}
                  </div>
                  {testResults.authCheck.success && (
                    <div className="text-sm text-muted-foreground">
                      Currently authenticated: {testResults.authCheck.isAuthenticated ? 'Yes' : 'No'}
                    </div>
                  )}
                  {testResults.authCheck.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{testResults.authCheck.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Login Test */}
          <Card>
            <CardHeader>
              <CardTitle>Login Test</CardTitle>
              <CardDescription>Test actual login with admin@test.com</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.loginTest && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Login Attempt:</span>
                    {getStatusBadge(testResults.loginTest.success)}
                  </div>
                  {testResults.loginTest.message && (
                    <div className="text-sm text-muted-foreground">
                      Message: {testResults.loginTest.message}
                    </div>
                  )}
                  {testResults.loginTest.hasTokens && (
                    <div className="text-sm text-green-600">
                      ✓ JWT tokens received
                    </div>
                  )}
                  {testResults.loginTest.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{testResults.loginTest.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User After Login */}
          {testResults.userAfterLogin && (
            <Card>
              <CardHeader>
                <CardTitle>User Data After Login</CardTitle>
                <CardDescription>User information retrieved after successful login</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>User Retrieval:</span>
                    {getStatusBadge(testResults.userAfterLogin.success)}
                  </div>
                  {testResults.userAfterLogin.user && (
                    <div className="p-3 bg-muted rounded">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(testResults.userAfterLogin.user, null, 2)}
                      </pre>
                    </div>
                  )}
                  {testResults.userAfterLogin.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{testResults.userAfterLogin.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Health Check */}
          <Card>
            <CardHeader>
              <CardTitle>API Health Check</CardTitle>
              <CardDescription>Test connection to backend API</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.healthCheck && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Health Check:</span>
                    {getStatusBadge(testResults.healthCheck.success)}
                  </div>
                  {testResults.healthCheck.success && testResults.healthCheck.data && (
                    <div className="p-3 bg-muted rounded">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(testResults.healthCheck.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {testResults.healthCheck.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{testResults.healthCheck.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Results */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Test Results</CardTitle>
              <CardDescription>Complete test results for debugging</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <div className="text-center">
            <div className="space-x-4">
              <a href="/debug-env" className="text-primary hover:underline">Debug Env</a>
              <a href="/debug-auth" className="text-primary hover:underline">Debug Auth</a>
              <a href="/hub" className="text-primary hover:underline">Hub</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}