'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { emailVerification } from '@/lib/auth/email-verification';

interface EmailVerificationFormProps {
  email: string;
  onVerificationSuccess: () => void;
  onBackToSignup?: () => void;
}

export function EmailVerificationForm({ 
  email, 
  onVerificationSuccess, 
  onBackToSignup 
}: EmailVerificationFormProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter the verification code.' });
      return;
    }

    setIsVerifying(true);
    setMessage(null);

    try {
      const result = await emailVerification.confirmSignUp(email, verificationCode.trim());
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Email verified successfully!' });
        // Wait a moment to show success message, then call success callback
        setTimeout(() => {
          onVerificationSuccess();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message || 'Verification failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Verification failed. Please try again.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setMessage(null);

    try {
      const result = await emailVerification.resendVerificationCode(email);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Verification code sent!' });
        setVerificationCode(''); // Clear the input
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to resend code.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to resend code. Please try again.' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a verification code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="text-center text-lg tracking-widest"
              disabled={isVerifying}
              autoComplete="one-time-code"
            />
            <p className="text-sm text-gray-500 mt-1">
              Check your email for the 6-digit verification code
            </p>
          </div>

          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isVerifying || !verificationCode.trim()}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResendCode}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Code
                </>
              )}
            </Button>
          </div>

          {onBackToSignup && (
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={onBackToSignup}
                className="text-sm"
              >
                ← Back to Sign Up
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            The verification code will expire in 24 hours
          </p>
        </div>
      </CardContent>
    </Card>
  );
}