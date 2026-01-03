"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DebugEnvPage() {
  const envVars = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Environment Variables Debug</h1>
            <p className="text-muted-foreground">Check if all required environment variables are loaded</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables Status</CardTitle>
              <CardDescription>These variables should all be set for authentication to work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">{key}:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={value ? "default" : "destructive"}>
                        {value ? "✓ Set" : "✗ Missing"}
                      </Badge>
                      {value && (
                        <span className="text-sm text-muted-foreground max-w-xs truncate">
                          {key.includes('CLIENT_ID') || key.includes('USER_POOL_ID') 
                            ? `${value.substring(0, 10)}...` 
                            : value
                          }
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw Environment Data</CardTitle>
              <CardDescription>Complete environment variable values</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(envVars, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Browser Information</CardTitle>
              <CardDescription>Browser and runtime information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</div>
                <div><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                <div><strong>Protocol:</strong> {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</div>
                <div><strong>Host:</strong> {typeof window !== 'undefined' ? window.location.host : 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <div className="space-x-4">
              <a href="/hub" className="text-primary hover:underline">← Back to Hub</a>
              <a href="/debug-auth" className="text-primary hover:underline">Debug Auth →</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}