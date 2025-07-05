import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const activationSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ActivationFormData = z.infer<typeof activationSchema>;

export default function StaffActivation() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activationStatus, setActivationStatus] = useState<"pending" | "success" | "error">("pending");
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email: string } | null>(null);

  // Extract token from URL
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const token = urlParams.get("token");

  const form = useForm<ActivationFormData>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Verify token on page load
  useEffect(() => {
    if (!token) {
      setActivationStatus("error");
      toast({
        title: "Invalid Link",
        description: "This activation link is invalid or missing.",
        variant: "destructive",
      });
      return;
    }

    // Verify token is valid by making a request to the backend
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-token?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data.user);
        } else {
          throw new Error("Invalid token");
        }
      } catch (error) {
        setActivationStatus("error");
        toast({
          title: "Invalid or Expired Link",
          description: "This activation link is invalid or has expired. Please request a new invitation.",
          variant: "destructive",
        });
      }
    };

    verifyToken();
  }, [token, toast]);

  const onSubmit = async (data: ActivationFormData) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/activate", {
        token,
        password: data.password,
      });

      setActivationStatus("success");
      toast({
        title: "Account Activated",
        description: "Your account has been successfully activated. You can now log in.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Activation Failed",
        description: error?.message || "Failed to activate account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || activationStatus === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invalid Activation Link</CardTitle>
            <CardDescription>
              This activation link is invalid or has expired. Please contact your administrator for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activationStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Account Activated</CardTitle>
            <CardDescription>
              Your account has been successfully activated. You will be redirected to the login page shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Activate Your Account</CardTitle>
          <CardDescription>
            {userInfo ? (
              <>Welcome {userInfo.firstName} {userInfo.lastName}! Set your password to complete account activation.</>
            ) : (
              "Set your password to complete account activation."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {userInfo && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {userInfo.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {userInfo.firstName} {userInfo.lastName}
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Enter your password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Confirm your password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Activating..." : "Activate Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}