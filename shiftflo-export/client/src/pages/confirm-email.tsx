import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { Link } from "wouter";

export default function ConfirmEmail() {
  const [location] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid confirmation link. No token provided.');
      return;
    }

    // Call the API to confirm the email change
    fetch(`/api/auth/confirm-email?token=${token}`)
      .then(async (response) => {
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email address updated successfully!');
          setNewEmail(data.newEmail || '');
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to confirm email change.');
        }
      })
      .catch((error) => {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('An error occurred while confirming your email change.');
      });
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className={`text-2xl ${getStatusColor()}`}>
            {status === 'loading' && 'Confirming Email Change'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </CardTitle>
          <CardDescription className="text-base">
            {status === 'loading' && 'Please wait while we confirm your email change...'}
            {status === 'success' && 'Your email address has been successfully updated.'}
            {status === 'error' && 'We encountered an issue confirming your email change.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{message}</p>
            {status === 'success' && newEmail && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-green-700">
                <Mail className="h-4 w-4" />
                {newEmail}
              </div>
            )}
          </div>

          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You can now continue using ShiftFlo with your new email address.
              </p>
              <Link href="/">
                <Button className="w-full">
                  Continue to ShiftFlo
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                If you continue to experience issues, please try requesting a new email change from your profile settings.
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Return to ShiftFlo
                </Button>
              </Link>
            </div>
          )}

          {status === 'loading' && (
            <p className="text-xs text-gray-500">
              This should only take a few seconds...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}