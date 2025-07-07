import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Shield, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Email request schema
const emailRequestSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
});

// Verification code schema
const verificationSchema = z.object({
  verificationCode: z.string().length(6, "Verification code must be 6 digits").regex(/^\d+$/, "Code must be numeric"),
});

type EmailRequestForm = z.infer<typeof emailRequestSchema>;
type VerificationForm = z.infer<typeof verificationSchema>;

interface SecureEmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  userId?: number;
  type: "business" | "user";
  tenantId?: string;
}

export function SecureEmailChangeModal({
  isOpen,
  onClose,
  currentEmail,
  userId,
  type,
  tenantId,
}: SecureEmailChangeModalProps) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [requestedEmail, setRequestedEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestForm = useForm<EmailRequestForm>({
    resolver: zodResolver(emailRequestSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  const verificationForm = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      verificationCode: "",
    },
  });

  const requestMutation = useMutation({
    mutationFn: async (data: EmailRequestForm) => {
      const endpoint = type === "business" 
        ? "/api/email-change/request-business" 
        : "/api/email-change/request-user";
      
      const payload = type === "business" 
        ? { tenantId, newEmail: data.newEmail }
        : { userId, newEmail: data.newEmail };

      const response = await apiRequest("POST", endpoint, payload);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send verification email");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setRequestedEmail(requestForm.getValues().newEmail);
      setStep("verify");
      toast({
        title: "Verification Code Sent",
        description: `A 6-digit code has been sent to ${requestForm.getValues().newEmail}`,
      });
      
      // Show token in development for testing
      if (data.token && process.env.NODE_ENV === 'development') {
        console.log('🔐 DEV_VERIFICATION_CODE:', data.token);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerificationForm) => {
      const endpoint = type === "business" 
        ? "/api/email-change/verify-business" 
        : "/api/email-change/verify-user";
      
      const payload = type === "business" 
        ? { tenantId, verificationCode: data.verificationCode }
        : { userId, verificationCode: data.verificationCode };

      const response = await apiRequest("POST", endpoint, payload);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify email change");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Updated",
        description: `Email address successfully changed to ${requestedEmail}`,
      });
      
      // Invalidate relevant queries to refresh the UI
      if (type === "business") {
        queryClient.invalidateQueries({ queryKey: ["/api/business-profile"] });
      } else {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
      
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("request");
    setRequestedEmail("");
    requestForm.reset();
    verificationForm.reset();
    onClose();
  };

  const onRequestSubmit = (data: EmailRequestForm) => {
    requestMutation.mutate(data);
  };

  const onVerifySubmit = (data: VerificationForm) => {
    verifyMutation.mutate(data);
  };

  const handleBackToRequest = () => {
    setStep("request");
    setRequestedEmail("");
    verificationForm.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Secure Email Change
          </DialogTitle>
        </DialogHeader>

        {step === "request" && (
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                You'll receive a verification code at your new email address to confirm this change.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Current email:</strong> {currentEmail}
              </p>
            </div>

            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
                <FormField
                  control={requestForm.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="Enter new email address"
                          disabled={requestMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={requestMutation.isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={requestMutation.isPending}
                    className="flex-1"
                  >
                    {requestMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                We've sent a 6-digit verification code to <strong>{requestedEmail}</strong>. Please check your email and enter the code below.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Code expires in:</strong> 15 minutes</p>
              <p className="text-gray-600 mt-1">Didn't receive the email? Check your spam folder or try again.</p>
            </div>

            <Form {...verificationForm}>
              <form onSubmit={verificationForm.handleSubmit(onVerifySubmit)} className="space-y-4">
                <FormField
                  control={verificationForm.control}
                  name="verificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="text-center text-lg font-mono tracking-widest"
                          disabled={verifyMutation.isPending}
                          onChange={(e) => {
                            // Only allow numbers
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToRequest}
                    disabled={verifyMutation.isPending}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={verifyMutation.isPending}
                    className="flex-1"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Update Email"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}