import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';

const activationSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type ActivationForm = z.infer<typeof activationSchema>;
export default function StaffActivation() {
  const [location] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [activationStatus, setActivationStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const form = useForm<ActivationForm>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  // Extract token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setActivationStatus('error');
      setErrorMessage('No activation token provided');
    }
  }, [location]);
  const validateToken = async (tokenParam: string) => {
    try {
      const response = await fetch(`/api/auth/verify-token?token=${encodeURIComponent(tokenParam)}`);
      const data = await response.json();
      
      if (response.ok) {
        setUserInfo(data.user);
        setActivationStatus('ready');
      } else {
        setActivationStatus('error');
        setErrorMessage(data.message || 'Invalid or expired token');
      }
    } catch (error) {
      setErrorMessage('Failed to validate token');
  };
  const onSubmit = async (data: ActivationForm) => {
    if (!token) return;
      const response = await apiRequest('POST', '/api/auth/activate', {
        token,
        password: data.password,
      });
        setActivationStatus('success');
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Activation failed');
      setErrorMessage('Failed to activate account');
  if (activationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Validating activation link...</span>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (activationStatus === 'error') {
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Activation Failed</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Please contact your administrator for a new invitation link.
            </p>
  if (activationStatus === 'success') {
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Account Activated!</CardTitle>
            <CardDescription>
              Your account has been successfully activated. You can now sign in to ShiftFlo.
            </CardDescription>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = `/login?email=${encodeURIComponent(userInfo?.email || '')}`}
            >
              Go to Sign In
            </Button>
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Complete Your Account Setup</CardTitle>
          <CardDescription>
            Welcome {userInfo?.firstName}! Set your password to activate your ShiftFlo account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={userInfo?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
              <Label htmlFor="password">Password</Label>
                id="password"
                type="password"
                {...form.register('password')}
                placeholder="Enter your password"
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
              <Label htmlFor="confirmPassword">Confirm Password</Label>
                id="confirmPassword"
                {...form.register('confirmPassword')}
                placeholder="Confirm your password"
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
              type="submit" 
              className="w-full"
              disabled={form.formState.isSubmitting}
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating Account...
                </>
              ) : (
                'Activate Account'
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
