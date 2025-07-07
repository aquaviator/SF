import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRole } from "@/hooks/useRole";

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  userId: number;
}

export function EmailChangeModal({ isOpen, onClose, currentEmail, userId }: EmailChangeModalProps) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [newEmail, setNewEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const { toast } = useToast();

  const requestMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", `/api/users/${userId}/request-email-change`, {
        newEmail: email
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("📧 EMAIL_CHANGE_REQUESTED", data);
      setPendingToken(data.verificationToken); // For testing - remove in production
      setStep("verify");
      toast({
        title: "Verification Sent",
        description: `Verification email sent to ${newEmail}. Check your inbox.`,
      });
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
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", `/api/users/${userId}/verify-email-change`, {
        token
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ EMAIL_CHANGE_VERIFIED", data);
      toast({
        title: "Email Updated",
        description: "Your email address has been successfully updated.",
      });
      onClose();
      // Reload page to reflect email change
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequest = () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    requestMutation.mutate(newEmail);
  };

  const handleVerify = () => {
    if (!verificationToken) {
      toast({
        title: "Token Required",
        description: "Please enter the verification token.",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate(verificationToken);
  };

  const handleClose = () => {
    setStep("request");
    setNewEmail("");
    setVerificationToken("");
    setPendingToken("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            {step === "request" 
              ? "Enter your new email address to start the verification process."
              : "Enter the verification code sent to your new email address."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="current-email">Current Email</Label>
            <Input
              id="current-email"
              value={currentEmail}
              disabled
              className="bg-muted"
            />
          </div>

          {step === "request" ? (
            <>
              <div>
                <Label htmlFor="new-email">New Email Address</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleRequest}
                  disabled={requestMutation.isPending}
                  className="flex-1"
                >
                  {requestMutation.isPending ? "Sending..." : "Send Verification"}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="verification-token">Verification Token</Label>
                <Input
                  id="verification-token"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="Enter verification token"
                />
                {pendingToken && (
                  <p className="text-xs text-muted-foreground mt-1">
                    For testing: {pendingToken}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleVerify}
                  disabled={verifyMutation.isPending}
                  className="flex-1"
                >
                  {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
                </Button>
                <Button variant="outline" onClick={() => setStep("request")}>
                  Back
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}