'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailVerificationForm } from '@/components/auth/email-verification-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { emailVerification } from '@/lib/auth/email-verification';
import { useAuth } from '@/contexts/auth-context';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email');
    const storedEmail = localStorage.getItem('pending_verification_email');
    
    const userEmail = emailParam || storedEmail;
    
    if (!userEmail) {
      setError('No email found for verification. Please sign up again.');
      setIsLoading(false);
      return;
    }

    setEmail(userEmail);
    
    // Store email in localStorage for persistence
    if (emailParam) {
      localStorage.setItem('pending_verification_email', emailParam);
    }

    // Check if user is already verified
    checkVerificationStatus(userEmail);
  }, [searchParams]);

  const checkVerificationStatus = async (userEmail: string) => {
    try {
      const status = await emailVerification.checkVerificationStatus(userEmail);
      
      if (!status.needsVerification) {
        setIsVerified(true);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = async () => {
    setIsVerified(true);
    
    // Clear the stored email
    localStorage.removeItem('pending_verification_email');
    
    // Try to get stored password for auto-login (if available)
    const storedPassword = sessionStorage.getItem('temp_signup_password');
    
    if (storedPassword) {
      try {
        const loginResult = await login(email, storedPassword);
        if (loginResult.success) {
          // Clear temporary password
          sessionStorage.removeItem('temp_signup_password');
          // Redirect to dashboard
          router.push('/hub');
          return;
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
      }
    }
    
    // If auto-login fails or no password stored, redirect to login
    setTimeout(() => {
      router.push('/auth/login?message=verified');
    }, 2000);
  };

  const handleBackToSignup = () => {
    localStorage.removeItem('pending_verification_email');
    router.push('/auth/signup');
  };

  const handleGoToLogin = () => {
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Checking verification status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl font-bold text-red-600">Verification Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button onClick={() => router.push('/auth/signup')} className="w-full">
                Go to Sign Up
              </Button>
              <Button onClick={() => router.push('/auth/login')} variant="outline" className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-xl font-bold text-green-600">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50 mb-4">
              <AlertDescription className="text-green-800">
                You can now sign in to your account.
              </AlertDescription>
            </Alert>
            <Button onClick={handleGoToLogin} className="w-full">
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <EmailVerificationForm
        email={email}
        onVerificationSuccess={handleVerificationSuccess}
        onBackToSignup={handleBackToSignup}
      />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}