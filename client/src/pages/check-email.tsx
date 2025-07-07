import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function CheckEmail() {
  const [location] = useLocation();
  const [emailType, setEmailType] = useState<'email-change' | 'password-reset' | 'activation'>('email-change');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') as 'email-change' | 'password-reset' | 'activation';
    if (type) {
      setEmailType(type);
    }
  }, []);

  const getContent = () => {
    switch (emailType) {
      case 'email-change':
        return {
          title: 'Check Your Email',
          description: 'We\'ve sent you a confirmation email to verify your new email address.',
          content: 'Please check your new email address for a confirmation link. Click the link in the email to complete your email address change.',
          extraInfo: 'This link will expire in 1 hour for security purposes.'
        };
      case 'password-reset':
        return {
          title: 'Password Reset Email Sent',
          description: 'We\'ve sent you instructions to reset your password.',
          content: 'Please check your email for a password reset link. Click the link in the email to set a new password.',
          extraInfo: 'This link will expire in 1 hour for security purposes.'
        };
      case 'activation':
        return {
          title: 'Account Activation Required',
          description: 'We\'ve sent you an activation email.',
          content: 'Please check your email for an activation link. Click the link in the email to activate your ShiftFlo account.',
          extraInfo: 'This link will expire in 24 hours.'
        };
      default:
        return {
          title: 'Check Your Email',
          description: 'We\'ve sent you an important email.',
          content: 'Please check your email and follow the instructions provided.',
          extraInfo: ''
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-blue-600">
            {content.title}
          </CardTitle>
          <CardDescription className="text-base">
            {content.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">
              {content.content}
            </p>
            {content.extraInfo && (
              <p className="text-xs text-gray-500">
                {content.extraInfo}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Didn't receive the email? Check your spam folder or request a new one from your profile settings.
            </p>
            
            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to ShiftFlo
                </Button>
              </Link>
              
              {emailType === 'email-change' && (
                <Link href="/owner/profile" className="flex-1">
                  <Button className="w-full">
                    Return to Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <CheckCircle className="h-3 w-3" />
              <span>Secure email delivery powered by ShiftFlo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}