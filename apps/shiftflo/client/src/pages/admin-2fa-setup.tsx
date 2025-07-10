import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Smartphone, Copy, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TwoFASetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}

export default function Admin2FASetup() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'init' | 'setup' | 'verify'>('init');
  const [setupData, setSetupData] = useState<TwoFASetup | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleInitiate2FA = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/admin/2fa/setup");
      const data = await response.json();
      setSetupData(data);
      setStep('setup');
    } catch (err: any) {
      setError(err.message || "Failed to initiate 2FA setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await apiRequest("POST", "/api/admin/2fa/verify-setup", {
        token: verificationCode,
        secret: setupData?.secret
      });
      
      // Success - redirect to admin portal
      setLocation("/site-admin");
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (setupData?.manualEntryKey) {
      try {
        await navigator.clipboard.writeText(setupData.manualEntryKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (step === 'init') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ShiftFlo</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Site Admin Portal</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Enable Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p className="mb-3">Secure your admin account with two-factor authentication (2FA).</p>
                  <p className="mb-3">You'll need an authenticator app like:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Google Authenticator</li>
                    <li>Microsoft Authenticator</li>
                    <li>Authy</li>
                    <li>1Password</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleInitiate2FA} 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-4 w-4" />
                      Set Up 2FA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ShiftFlo</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Scan QR Code</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Step 1: Add to Authenticator App</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Scan this QR code with your authenticator app:
                </p>
                
                {setupData?.qrCode && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={setupData.qrCode} 
                      alt="2FA QR Code" 
                      className="border rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Or enter this code manually:</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={setupData?.manualEntryKey || ''} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={() => setStep('verify')} 
                className="w-full"
              >
                Continue to Verification
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ShiftFlo</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Verify Setup</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Verify Your Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifySetup} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="code">Enter 6-digit code from your authenticator app:</Label>
                <Input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  disabled={isLoading}
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button 
                variant="ghost" 
                onClick={() => setStep('setup')}
                disabled={isLoading}
              >
                Back to QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}