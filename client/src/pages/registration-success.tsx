import { Mail, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegistrationSuccess() {
  const handleGoToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Registration Successful!
              </CardTitle>
              <CardDescription className="text-lg">
                Welcome to ShiftFlo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Check Your Email
                </h3>
                <p className="text-gray-600 mb-4">
                  We've sent an activation link to your email address. Click the link to set up your password and access your ShiftFlo dashboard.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> The activation link will expire in 24 hours. If you don't see the email, check your spam folder.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleGoToLogin}
                  className="w-full"
                  size="lg"
                >
                  Go to Login Page
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Already activated your account?{" "}
                    <button 
                      onClick={handleGoToLogin}
                      className="text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Activate your account via email</li>
                  <li>• Set up your business profile</li>
                  <li>• Invite your first team members</li>
                  <li>• Start creating schedules</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}