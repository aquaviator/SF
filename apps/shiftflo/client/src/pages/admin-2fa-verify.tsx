import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Admin2FAVerify() {
  const [, setLocation] = useLocation();
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await apiRequest("POST", "/api/admin/2fa/verify", {
        token: verificationCode
      });
      
      // Success - redirect to admin portal
      setLocation("/site-admin");
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

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
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
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
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Open your authenticator app and enter the current 6-digit code.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/admin/login")}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}