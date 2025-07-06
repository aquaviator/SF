import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Smartphone, AlertCircle } from 'lucide-react';

interface Admin {
  id: number;
  username: string;
  email: string;
  role: string;
  is2faEnabled: boolean;
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [admin, setAdmin] = useState<Admin | null>(null);
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // 2FA form state
  const [totpCode, setTotpCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.require2fa) {
        setAdmin(data.admin);
        setStep('2fa');
        console.log('🔐 ADMIN_2FA_REQUIRED', { username: data.admin.username });
      } else {
        console.log('✅ ADMIN_LOGIN_SUCCESS', { username: data.admin.username, role: data.admin.role });
        setLocation('/admin/dashboard');
      }
    } catch (error: any) {
      console.error('❌ ADMIN_LOGIN_ERROR', { error: error.message });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '2FA verification failed');
      }

      console.log('✅ ADMIN_2FA_SUCCESS', { username: admin?.username });
      setLocation('/admin/dashboard');
    } catch (error: any) {
      console.error('❌ ADMIN_2FA_ERROR', { error: error.message });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'support': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'finance': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'marketing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ShiftFlo Admin</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'login' ? 'Access the admin portal' : 'Two-factor authentication required'}
          </p>
        </div>

        {/* Login Form */}
        {step === 'login' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Admin Login</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your admin username"
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 2FA Form */}
        {step === '2fa' && admin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Two-Factor Authentication</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Logged in as: <span className="font-medium text-gray-900 dark:text-white">{admin.username}</span>
                </p>
                <Badge className={getRoleColor(admin.role)}>
                  {admin.role.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Enter the 6-digit code from your authenticator app.
                </AlertDescription>
              </Alert>

              <form onSubmit={handle2FA} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totpCode">Authentication Code</Label>
                  <Input
                    id="totpCode"
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    required
                    className="text-center text-lg tracking-widest"
                    autoComplete="one-time-code"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={loading || totpCode.length !== 6}>
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setStep('login');
                      setAdmin(null);
                      setTotpCode('');
                      setError('');
                    }}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Secure Admin Access</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This portal is protected with enterprise-grade security including 2FA authentication and audit logging.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Development Access</h3>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <p><strong>Super Admin:</strong> admin / password123</p>
                  <p><strong>Support:</strong> support / password123</p>
                  <p className="text-xs">Note: 2FA is disabled for development accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}