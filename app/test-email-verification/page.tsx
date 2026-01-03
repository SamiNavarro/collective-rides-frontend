'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestEmailVerificationPage() {
  const [testData, setTestData] = useState({
    email: 'test@example.com',
    verificationCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const testVerifyEmail = async () => {
    if (!testData.verificationCode.trim()) {
      addResult('Email Verification', false, 'Verification code is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/test-email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testData.email,
          verificationCode: testData.verificationCode,
          action: 'confirm'
        }),
      });

      const result = await response.json();
      addResult('Email Verification', result.success, result.success ? result.message : result.error, result);
    } catch (error) {
      addResult('Email Verification', false, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testResendCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testData.email,
          action: 'resend'
        }),
      });

      const result = await response.json();
      addResult('Resend Verification Code', result.success, result.success ? result.message : result.error, result);
    } catch (error) {
      addResult('Resend Verification Code', false, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const addResult = (test: string, success: boolean, message: string, details?: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Email Verification Testing
            </CardTitle>
            <CardDescription>
              Test AWS Cognito email verification flow with the code you received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-email">Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testData.email}
                  onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter the email you used for signup"
                />
              </div>

              <div>
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  value={testData.verificationCode}
                  onChange={(e) => setTestData(prev => ({ ...prev, verificationCode: e.target.value }))}
                  placeholder="Enter 6-digit code from email"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Check your email for the verification code from AWS Cognito
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={testVerifyEmail} 
                  disabled={isLoading || !testData.verificationCode.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>
                
                <Button 
                  onClick={testResendCode} 
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Code'
                  )}
                </Button>
                
                <Button 
                  onClick={clearResults} 
                  variant="ghost"
                  size="sm"
                >
                  Clear Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    {result.test}
                  </CardTitle>
                  <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {result.success ? '✅ SUCCESS' : '❌ FAILED'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">{result.timestamp}</p>
              </CardHeader>
              <CardContent>
                <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                    {result.message}
                  </AlertDescription>
                </Alert>

                {result.details && (
                  <details className="mt-4">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      View Technical Details
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
            <CardTitle>How to Test Email Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">📧 Step 1: Get Verification Code</h4>
                <p>Check your email for a message from AWS Cognito with subject "Verify your Sydney Cycles account"</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🔢 Step 2: Enter Code</h4>
                <p>Copy the 6-digit verification code from the email and paste it in the field above</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">✅ Step 3: Verify</h4>
                <p>Click "Verify Email" to confirm your email address with AWS Cognito</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🔄 Alternative: Resend Code</h4>
                <p>If you didn't receive the email or the code expired, click "Resend Code" to get a new one</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-800">💡 Testing Tips</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Check your spam/junk folder if you don't see the email</li>
                  <li>Verification codes expire after 24 hours</li>
                  <li>You can only use each code once</li>
                  <li>After successful verification, you can sign in normally</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}