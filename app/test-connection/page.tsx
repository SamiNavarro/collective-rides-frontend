'use client';

import { useState, useEffect } from 'react';

interface TestResult {
  test: string;
  status: string;
  data?: any;
  error?: string;
  statusCode?: number;
  note?: string;
  missing?: string[];
  loaded?: any;
}

export default function TestConnectionPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results: TestResult[] = [];

    // Test 1: Environment Variables
    const envVars = {
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      stravaClientId: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
    };

    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    results.push({
      test: 'Environment Variables',
      status: missingVars.length === 0 ? '✅ PASS' : '❌ FAIL',
      missing: missingVars,
      loaded: envVars
    });

    // Test 2: Health Check
    if (process.env.NEXT_PUBLIC_API_URL) {
      try {
        const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
        const healthData = await healthResponse.json();
        results.push({
          test: 'Backend Health Check',
          status: healthResponse.ok ? '✅ PASS' : '❌ FAIL',
          statusCode: healthResponse.status,
          data: healthData
        });
      } catch (error) {
        results.push({
          test: 'Backend Health Check',
          status: '❌ FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 3: CORS Check
      try {
        const corsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/clubs`);
        results.push({
          test: 'CORS Configuration',
          status: corsResponse.status !== 0 ? '✅ PASS' : '❌ FAIL',
          statusCode: corsResponse.status,
          note: corsResponse.status === 401 ? 'Expected 401 (auth required)' : undefined
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          test: 'CORS Configuration',
          status: errorMessage.includes('CORS') ? '❌ FAIL' : '⚠️ OTHER',
          error: errorMessage
        });
      }

      // Test 4: Protected Endpoint
      try {
        const protectedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/current`);
        results.push({
          test: 'Protected Endpoint',
          status: protectedResponse.status === 401 ? '✅ PASS' : '⚠️ CHECK',
          statusCode: protectedResponse.status,
          note: 'Should return 401 (Unauthorized)'
        });
      } catch (error) {
        results.push({
          test: 'Protected Endpoint',
          status: '❌ FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: Strava Webhook Endpoint
      try {
        const stravaResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/integrations/strava/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=wrong`
        );
        results.push({
          test: 'Strava Webhook Endpoint',
          status: stravaResponse.status === 403 ? '✅ PASS' : '❌ FAIL',
          statusCode: stravaResponse.status,
          note: 'Expected 403 with wrong token'
        });
      } catch (error) {
        results.push({
          test: 'Strava Webhook Endpoint',
          status: '❌ FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      results.push({
        test: 'API Tests',
        status: '⚠️ SKIPPED',
        note: 'NEXT_PUBLIC_API_URL not configured'
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusColor = (status: string) => {
    if (status.includes('✅')) return 'bg-green-50 border-green-200';
    if (status.includes('❌')) return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getStatusTextColor = (status: string) => {
    if (status.includes('✅')) return 'text-green-800';
    if (status.includes('❌')) return 'text-red-800';
    return 'text-yellow-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Frontend-Backend Connection Test
            </h1>
            <button
              onClick={runTests}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Running Tests...' : 'Run Tests Again'}
            </button>
          </div>

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {result.test}
                  </h3>
                  <span className={`font-mono text-sm ${getStatusTextColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>

                {result.statusCode && (
                  <p className="text-sm text-gray-600 mb-2">
                    Status Code: {result.statusCode}
                  </p>
                )}

                {result.note && (
                  <p className="text-sm text-blue-600 mb-2 italic">
                    {result.note}
                  </p>
                )}

                {result.error && (
                  <p className="text-sm text-red-600 mb-2">
                    Error: {result.error}
                  </p>
                )}

                {result.missing && result.missing.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-red-600 font-medium">
                      Missing Variables: {result.missing.join(', ')}
                    </p>
                  </div>
                )}

                {result.data && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      View Response Data
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}

                {result.loaded && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      View Environment Variables
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.loaded, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {testResults.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Click "Run Tests" to start testing the connection
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Running connection tests...</p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Backend API</h3>
              <p className="text-gray-600 font-mono break-all">
                {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">AWS Region</h3>
              <p className="text-gray-600 font-mono">
                {process.env.NEXT_PUBLIC_AWS_REGION || 'Not configured'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Cognito User Pool</h3>
              <p className="text-gray-600 font-mono">
                {process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'Not configured'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Strava Client ID</h3>
              <p className="text-gray-600 font-mono">
                {process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || 'Not configured'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}