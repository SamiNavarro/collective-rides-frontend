'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';

export default function TestNewUserPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();

  const runTests = () => {
    setIsRunning(true);
    const results = [];

    // Test 1: Environment Variables
    const envVars = {
      'API URL': process.env.NEXT_PUBLIC_API_URL,
      'AWS Region': process.env.NEXT_PUBLIC_AWS_REGION,
      'Cognito User Pool': process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      'Cognito Client': process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      'Strava Client': process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    };

    const missingEnvVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    results.push({
      test: 'Environment Variables',
      status: missingEnvVars.length === 0 ? '✅ PASS' : '⚠️ PARTIAL',
      details: envVars,
      missing: missingEnvVars
    });

    // Test 2: User Authentication State
    const userData = localStorage.getItem('sydney-cycles-user');
    let userInfo = null;
    
    if (userData) {
      try {
        userInfo = JSON.parse(userData);
      } catch (e) {
        // Invalid JSON
      }
    }

    results.push({
      test: 'User Authentication',
      status: userInfo ? '✅ LOGGED IN' : '❌ NOT LOGGED IN',
      details: userInfo ? {
        name: userInfo.name,
        email: userInfo.email,
        role: userInfo.siteRole,
        clubs: userInfo.joinedClubs?.length || 0,
        applications: userInfo.clubApplications?.length || 0
      } : null
    });

    // Test 3: Navigation Links
    const navigationLinks = [
      { path: '/', name: 'Homepage' },
      { path: '/hub', name: 'My Hub' },
      { path: '/clubs', name: 'Clubs' },
      { path: '/routes', name: 'Routes' },
      { path: '/coffee', name: 'Coffee' },
      { path: '/my-clubs', name: 'My Clubs' },
      { path: '/rides', name: 'My Rides' }
    ];

    const linkResults = navigationLinks.map(link => {
      const linkElement = document.querySelector(`a[href="${link.path}"]`);
      return {
        name: link.name,
        path: link.path,
        found: !!linkElement
      };
    });

    const workingLinks = linkResults.filter(link => link.found).length;
    
    results.push({
      test: 'Navigation Links',
      status: workingLinks === navigationLinks.length ? '✅ ALL WORKING' : `⚠️ ${workingLinks}/${navigationLinks.length} WORKING`,
      details: linkResults
    });

    // Test 4: Page Functionality
    const currentPath = window.location.pathname;
    const isOnTestPage = currentPath === '/test-new-user';
    
    results.push({
      test: 'Page Functionality',
      status: isOnTestPage ? '✅ TEST PAGE WORKING' : '⚠️ UNEXPECTED PATH',
      details: {
        currentPath,
        expectedPath: '/test-new-user'
      }
    });

    // Test 5: Local Storage
    const storageTest = () => {
      try {
        localStorage.setItem('test-key', 'test-value');
        const retrieved = localStorage.getItem('test-key');
        localStorage.removeItem('test-key');
        return retrieved === 'test-value';
      } catch (e) {
        return false;
      }
    };

    results.push({
      test: 'Local Storage',
      status: storageTest() ? '✅ WORKING' : '❌ FAILED',
      details: 'Required for user session persistence'
    });

    setTestResults(results);
    setIsRunning(false);
  };

  const clearUserData = () => {
    localStorage.removeItem('sydney-cycles-user');
    localStorage.clear();
    window.location.reload();
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
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">New User Experience Testing</CardTitle>
            <CardDescription>
              Test the complete new user journey from signup to feature exploration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Button onClick={runTests} disabled={isRunning}>
                {isRunning ? 'Running Tests...' : 'Run Tests'}
              </Button>
              <Button variant="outline" onClick={clearUserData}>
                Clear User Data & Reload
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go to Homepage
              </Button>
            </div>

            {user && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Current User</h3>
                <p className="text-blue-800">
                  <strong>Name:</strong> {user.name}<br />
                  <strong>Email:</strong> {user.email}<br />
                  <strong>Role:</strong> {user.siteRole}<br />
                  <strong>Clubs:</strong> {user.joinedClubs?.length || 0}<br />
                  <strong>Applications:</strong> {user.clubApplications?.length || 0}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>New User Testing Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🆕 Scenario 1: First-Time Signup</h3>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Clear user data (button above)</li>
                  <li>Go to homepage</li>
                  <li>Click "Join Community"</li>
                  <li>Fill form: Alex Johnson, alex.johnson@example.com, SecurePass123</li>
                  <li>Submit and verify redirect to /hub</li>
                </ol>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🏢 Scenario 2: Club Application</h3>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>After signup, navigate to "Clubs"</li>
                  <li>Click on "Sydney Cycling Club"</li>
                  <li>Click "Apply to Join"</li>
                  <li>Fill application form</li>
                  <li>Submit and check "My Clubs"</li>
                </ol>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🗺️ Scenario 3: Feature Exploration</h3>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Navigate to "Routes" section</li>
                  <li>Browse available routes</li>
                  <li>Check "Coffee" section</li>
                  <li>Test user avatar dropdown menu</li>
                  <li>Visit "My Hub" dashboard</li>
                </ol>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📱 Scenario 4: Mobile Testing</h3>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Open browser dev tools (F12)</li>
                  <li>Enable device toolbar (mobile view)</li>
                  <li>Test signup flow on mobile</li>
                  <li>Test hamburger menu navigation</li>
                  <li>Verify touch interactions work</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Success Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">✅ Must Work</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Signup completes successfully</li>
                  <li>User redirected to /hub</li>
                  <li>User avatar appears in header</li>
                  <li>All navigation links work</li>
                  <li>Club application process</li>
                  <li>Session persists across refreshes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🚨 Watch For Issues</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Form validation failures</li>
                  <li>JavaScript console errors</li>
                  <li>Broken navigation links</li>
                  <li>Mobile layout problems</li>
                  <li>Session not persisting</li>
                  <li>API connection issues</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}