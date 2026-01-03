'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordValidator } from '@/components/password-validator';
import { useAuth } from '@/contexts/auth-context';
import { cognitoAuth } from '@/lib/auth/cognito-service';
import { api } from '@/lib/api/api-client';

export default function TestCognitoPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testCredentials, setTestCredentials] = useState({
    email: 'test@example.com',
    password: 'TestPass123',
    name: 'Test User',
    verificationCode: ''
  });
  
  const { user, isAuthenticated, isLoading } = useAuth();

  const runCognitoTests = async () => {
    setIsRunning(true);
    const results = [];

    // Test 1: Environment Configuration
    const envConfig = {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
    };

    // Also test via API route
    try {
      const envResponse = await fetch('/api/test-env');
      const envData = await envResponse.json();
      
      results.push({
        test: 'Environment Configuration (Server)',
        status: envData.success ? '✅ PASS' : '❌ FAIL',
        details: envData,
        serverSide: true
      });
    } catch (error) {
      results.push({
        test: 'Environment Configuration (Server)',
        status: '❌ FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const missingEnv = Object.entries(envConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    results.push({
      test: 'Environment Configuration (Client)',
      status: missingEnv.length === 0 ? '✅ PASS' : '❌ FAIL',
      details: envConfig,
      missing: missingEnv
    });

    // Test 2: Cognito Service Initialization
    try {
      const isServiceReady = !!cognitoAuth;
      results.push({
        test: 'Cognito Service Initialization',
        status: isServiceReady ? '✅ PASS' : '❌ FAIL',
        details: 'Service initialized successfully'
      });
    } catch (error) {
      results.push({
        test: 'Cognito Service Initialization',
        status: '❌ FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: API Client Health Check
    try {
      const healthResponse = await api.health();
      results.push({
        test: 'API Client Health Check',
        status: healthResponse.success ? '✅ PASS' : '❌ FAIL',
        details: healthResponse.data,
        statusCode: healthResponse.statusCode
      });
    } catch (error) {
      results.push({
        test: 'API Client Health Check',
        status: '❌ FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Authentication State
    results.push({
      test: 'Authentication State',
      status: isAuthenticated ? '✅ AUTHENTICATED' : '⚠️ NOT AUTHENTICATED',
      details: {
        isAuthenticated,
        isLoading,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          siteRole: user.siteRole
        } : null
      }
    });

    // Test 5: Token Storage
    try {
      const storedTokens = localStorage.getItem('cognito_tokens');
      results.push({
        test: 'Token Storage',
        status: storedTokens ? '✅ TOKENS FOUND' : '⚠️ NO TOKENS',
        details: storedTokens ? 'Tokens stored in localStorage' : 'No tokens found'
      });
    } catch (error) {
      results.push({
        test: 'Token Storage',
        status: '❌ FAIL',
        error: 'Cannot access localStorage'
      });
    }

    // Test 6: Protected API Call (if authenticated)
    if (isAuthenticated) {
      try {
        const userResponse = await api.user.getCurrent();
        results.push({
          test: 'Protected API Call',
          status: userResponse.success ? '✅ PASS' : '❌ FAIL',
          details: userResponse.data,
          statusCode: userResponse.statusCode
        });
      } catch (error) {
        results.push({
          test: 'Protected API Call',
          status: '❌ FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const testPasswordValidation = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/test-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCredentials),
      });
      
      const result = await response.json();
      
      setTestResults(prev => [...prev, {
        test: 'Password Validation',
        status: result.allValid ? '✅ PASS' : '❌ FAIL',
        details: result,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Password Validation',
        status: '❌ FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
    }
    setIsRunning(false);
  };

  const testSignup = async () => {
    setIsRunning(true);
    try {
      const result = await cognitoAuth.signUp(
        testCredentials.email,
        testCredentials.password,
        testCredentials.name
      );
      
      setTestResults(prev => [...prev, {
        test: 'Test Signup',
        status: result.success ? '✅ PASS' : '❌ FAIL',
        details: result,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Test Signup',
        status: '❌ FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
    }
    setIsRunning(false);
  };

  const testEmailVerification = async (action: 'confirm' | 'resend') => {
    setIsRunning(true);
    try {
      const payload: any = {
        email: testCredentials.email,
        action
      };

      if (action === 'confirm') {
        if (!testCredentials.verificationCode) {
          setTestResults(prev => [...prev, {
            test: 'Email Verification',
            status: '❌ FAIL',
            error: 'Verification code is required',
            timestamp: new Date().toISOString()
          }]);
          setIsRunning(false);
          return;
        }
        payload.verificationCode = testCredentials.verificationCode;
      }

      const response = await fetch('/api/test-email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      setTestResults(prev => [...prev, {
        test: `Email Verification (${action})`,
        status: result.success ? '✅ PASS' : '❌ FAIL',
        details: result,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: `Email Verification (${action})`,
        status: '❌ FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
    }
    setIsRunning(false);
  };

  const testSignin = async () => {
    setIsRunning(true);
    try {
      const result = await cognitoAuth.signIn(
        testCredentials.email,
        testCredentials.password
      );
      
      setTestResults(prev => [...prev, {
        test: 'Test Signin',
        status: result.success ? '✅ PASS' : '❌ FAIL',
        details: result,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Test Signin',
        status: '❌ FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
    }
    setIsRunning(false);
  };

  const clearTokens = () => {
    localStorage.removeItem('cognito_tokens');
    setTestResults(prev => [...prev, {
      test: 'Clear Tokens',
      status: '✅ CLEARED',
      details: 'Tokens removed from localStorage',
      timestamp: new Date().toISOString()
    }]);
  };

  const getStatusColor = (status: string) => {
    if (status.includes('✅')) return 'bg-green-50 border-green-200';
    if (status.includes('❌')) return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getStatusBadgeColor = (status: string) => {
    if (status.includes('✅')) return 'bg-green-100 text-green-800';
    if (status.includes('❌')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  useEffect(() => {
    runCognitoTests();
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Cognito Authentication Testing</CardTitle>
            <CardDescription>
              Test AWS Cognito integration and JWT authentication flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6 flex-wrap">
              <Button onClick={runCognitoTests} disabled={isRunning}>
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button variant="outline" onClick={clearTokens}>
                Clear Tokens
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>

            {/* Current Auth State */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Current Authentication State</h3>
              <div className="text-blue-800 text-sm">
                <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
                {user && (
                  <>
                    <p><strong>User ID:</strong> {user.id}</p>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.siteRole}</p>
                  </>
                )}
              </div>
            </div>

            {/* Test Credentials */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Test Credentials & Email Verification</CardTitle>
                <CardDescription>
                  Test signup, signin, and email verification flow. Password must meet requirements: 8+ chars, uppercase, lowercase, digits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-email">Email</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testCredentials.email}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="test@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="test-password">Password</Label>
                  <Input
                    id="test-password"
                    type="password"
                    value={testCredentials.password}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Must have: 8+ chars, A-Z, a-z, 0-9"
                  />
                  <PasswordValidator password={testCredentials.password} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="test-name">Name</Label>
                  <Input
                    id="test-name"
                    type="text"
                    value={testCredentials.name}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <Label htmlFor="test-verification-code">Verification Code (for email verification)</Label>
                  <Input
                    id="test-verification-code"
                    type="text"
                    value={testCredentials.verificationCode}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, verificationCode: e.target.value }))}
                    placeholder="6-digit code from email"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={testSignup} disabled={isRunning} size="sm">
                    Test Signup
                  </Button>
                  <Button onClick={testSignin} disabled={isRunning} size="sm">
                    Test Signin
                  </Button>
                  <Button onClick={testPasswordValidation} disabled={isRunning} size="sm" variant="outline">
                    Validate Password
                  </Button>
                  <Button onClick={() => testEmailVerification('confirm')} disabled={isRunning} size="sm" variant="secondary">
                    Verify Email
                  </Button>
                  <Button onClick={() => testEmailVerification('resend')} disabled={isRunning} size="sm" variant="secondary">
                    Resend Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Test Results */}
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <Card key={index} className={getStatusColor(result.status)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{result.test}</CardTitle>
                  <Badge className={getStatusBadgeColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
                {result.timestamp && (
                  <p className="text-xs text-gray-500">{result.timestamp}</p>
                )}
              </CardHeader>
              <CardContent>
                {result.missing && result.missing.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-red-600 mb-2">Missing:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {result.missing.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.error && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-red-600 mb-2">Error:</p>
                    <p className="text-sm text-red-600">{result.error}</p>
                  </div>
                )}

                {result.statusCode && (
                  <p className="text-sm text-gray-600 mb-2">
                    Status Code: {result.statusCode}
                  </p>
                )}

                {result.details && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Email Verification Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🔧 Setup Requirements</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>All environment variables must be configured</li>
                  <li>Backend API must be accessible</li>
                  <li>Cognito User Pool must be deployed</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🧪 Test Scenarios</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Password Validation:</strong> Check if password meets requirements</li>
                  <li><strong>New User:</strong> Use test signup with a unique email</li>
                  <li><strong>Email Verification:</strong> Enter the 6-digit code from your email</li>
                  <li><strong>Existing User:</strong> Use test signin with existing credentials</li>
                  <li><strong>Token Management:</strong> Clear tokens and test re-authentication</li>
                  <li><strong>API Integration:</strong> Verify protected endpoints work with JWT</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">✅ Success Criteria</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>All environment variables loaded</li>
                  <li>Cognito service initializes without errors</li>
                  <li>API health check passes</li>
                  <li>Password validation shows all requirements met</li>
                  <li>Email verification code works correctly</li>
                  <li>Authentication state updates correctly</li>
                  <li>Protected API calls work when authenticated</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}