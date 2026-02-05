"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cognitoAuth } from "@/lib/auth/cognito-service"

export default function TestAliceLoginPage() {
  const [email, setEmail] = useState('alice.admin@example.com')
  const [password, setPassword] = useState('TempPassword123!')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Testing login with:', { email, password: '***' })
      
      const response = await cognitoAuth.signIn(email, password)
      
      console.log('Login response:', response)
      setResult(response)
    } catch (error: any) {
      console.error('Login error:', error)
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testUsers = [
    { email: 'alice.admin@example.com', password: 'TempPassword123!', role: 'Owner' },
    { email: 'admin@test.com', password: 'TestPassword123!', role: 'Admin' },
    { email: 'bob.captain@example.com', password: 'TempPassword123!', role: 'Captain' },
    { email: 'carol.leader@example.com', password: 'TempPassword123!', role: 'Leader' },
    { email: 'testuser2@test.com', password: 'TestPassword123!', role: 'Member' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test Alice Login - Phase 3.4</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>

          <Button onClick={testLogin} disabled={loading} className="w-full">
            {loading ? 'Testing...' : 'Test Login'}
          </Button>

          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Test Users:</p>
            {testUsers.map((user) => (
              <Button
                key={user.email}
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail(user.email)
                  setPassword(user.password)
                }}
                className="w-full justify-start"
              >
                {user.email} ({user.role})
              </Button>
            ))}
          </div>

          {result && (
            <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
              <CardContent className="pt-6">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Environment:</strong></p>
            <p>User Pool: {process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}</p>
            <p>Client ID: {process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID}</p>
            <p>Region: {process.env.NEXT_PUBLIC_AWS_REGION}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
