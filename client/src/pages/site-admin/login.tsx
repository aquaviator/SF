import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function SiteAdminLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      console.log("🔐 ADMIN_LOGIN_ATTEMPT", { username: data.username, has2FA: !!data.totpCode, timestamp: new Date() });
      
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        
        if (response.status === 422 && error.requires2FA) {
          setRequires2FA(true);
          toast({
            title: "2FA Required",
            description: "Please enter your authenticator code to continue.",
          });
          return;
        }
        
        throw new Error(error.message || "Login failed");
      }

      const result = await response.json();
      console.log("✅ ADMIN_LOGIN_SUCCESS", { adminId: result.admin?.id, role: result.admin?.role, timestamp: new Date() });
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${result.admin.username}!`,
      });

      // Store admin session
      localStorage.setItem("site_admin_session", JSON.stringify(result.admin));
      
      // Redirect to admin dashboard
      setLocation("/site-admin/dashboard");
      
    } catch (error: any) {
      console.error("❌ ADMIN_LOGIN_ERROR", { error: error.message, timestamp: new Date() });
      
      setError("root", {
        message: error.message || "Invalid credentials. Please try again.",
      });
      
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Site Admin Portal</CardTitle>
          <CardDescription>
            Secure access to system administration and platform management
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter admin username"
                {...register("username")}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  {...register("password")}
                  className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {requires2FA && (
              <div className="space-y-2">
                <Label htmlFor="totpCode">Authenticator Code</Label>
                <Input
                  id="totpCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  {...register("totpCode")}
                  className={errors.totpCode ? "border-red-500" : ""}
                />
                {errors.totpCode && (
                  <p className="text-sm text-red-500">{errors.totpCode.message}</p>
                )}
              </div>
            )}

            {errors.root && (
              <div className="text-sm text-red-500 text-center">
                {errors.root.message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Authorized personnel only</p>
            <p className="mt-1">All access attempts are logged and monitored</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}