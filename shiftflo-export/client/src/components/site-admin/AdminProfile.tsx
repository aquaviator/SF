import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Mail, 
  Key, 
  Shield, 
  Calendar,
  Loader2,
  AlertTriangle
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Password confirmation is required")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const emailChangeSchema = z.object({
  newEmail: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required for verification")
});

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>;
type EmailChangeForm = z.infer<typeof emailChangeSchema>;

export function AdminProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Fetch admin profile
  const { data: adminData, isLoading } = useQuery({
    queryKey: ["/api/admin/profile/me"],
    queryFn: async () => {
      const response = await fetch("/api/admin/profile/me", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    }
  });

  // Password change mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordChangeForm) => {
      const response = await fetch("/api/admin/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully"
      });
      setShowPasswordForm(false);
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Password Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Email change mutation
  const emailMutation = useMutation({
    mutationFn: async (data: EmailChangeForm) => {
      const response = await fetch("/api/admin/profile/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Updated",
        description: "Your email has been changed successfully"
      });
      setShowEmailForm(false);
      emailForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profile/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Email Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Forms
  const passwordForm = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const emailForm = useForm<EmailChangeForm>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      newEmail: "",
      password: ""
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const admin = adminData?.admin;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Profile</h2>
        <p className="text-muted-foreground">
          Manage your administrator account settings and security
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your administrator account details and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Username</Label>
                  <p className="text-sm text-muted-foreground">{admin?.username}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{admin?.email}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmailForm(true)}
                    >
                      Change
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Role</Label>
                  <Badge variant="secondary" className="w-fit">
                    {admin?.role?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">2FA Status</Label>
                  <Badge variant={admin?.is2faEnabled ? "default" : "outline"} className="w-fit">
                    {admin?.is2faEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Login</Label>
                  <p className="text-sm text-muted-foreground">
                    {admin?.lastLogin 
                      ? new Date(admin.lastLogin).toLocaleDateString()
                      : "Never"
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {admin?.createdAt 
                      ? new Date(admin.createdAt).toLocaleDateString()
                      : "Unknown"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            {/* Password Change Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your admin account password for enhanced security
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showPasswordForm ? (
                  <Button onClick={() => setShowPasswordForm(true)}>
                    Change Password
                  </Button>
                ) : (
                  <Form {...passwordForm}>
                    <form 
                      onSubmit={passwordForm.handleSubmit((data) => passwordMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                {...field} 
                                autoComplete="current-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                {...field} 
                                autoComplete="new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                {...field} 
                                autoComplete="new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={passwordMutation.isPending}
                        >
                          {passwordMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Update Password
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setShowPasswordForm(false);
                            passwordForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            {/* Email Change Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Change Email
                </CardTitle>
                <CardDescription>
                  Update your admin account email address
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showEmailForm ? (
                  <Button onClick={() => setShowEmailForm(true)}>
                    Change Email
                  </Button>
                ) : (
                  <Form {...emailForm}>
                    <form 
                      onSubmit={emailForm.handleSubmit((data) => emailMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={emailForm.control}
                        name="newEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                {...field} 
                                autoComplete="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                {...field} 
                                autoComplete="current-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={emailMutation.isPending}
                        >
                          {emailMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Update Email
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setShowEmailForm(false);
                            emailForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            {/* 2FA Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Enhance your account security with 2FA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      Status: {admin?.is2faEnabled ? "Enabled" : "Disabled"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {admin?.is2faEnabled 
                        ? "Your account is protected with 2FA"
                        : "Enable 2FA for additional security"
                      }
                    </p>
                  </div>
                  <Button 
                    variant={admin?.is2faEnabled ? "outline" : "default"}
                    asChild
                  >
                    <a href="/admin/2fa-setup">
                      {admin?.is2faEnabled ? "Manage 2FA" : "Enable 2FA"}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}