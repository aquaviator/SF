import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Building, Shield, Mail, Lock } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PhotoUpload } from "@/components/PhotoUpload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Validation schemas
const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

const businessDetailsSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  address: z.string().min(1, "Business address is required"),
  phone: z.string().min(1, "Business phone is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  businessType: z.string().optional(),
  description: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const changeEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  currentPassword: z.string().min(1, "Current password is required"),
});

// Interface types
interface UserType {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  role: string;
  tenantId: string;
}

interface BusinessProfileType {
  id: number;
  tenantId: string;
  name: string;
  ownerName?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  businessType?: string;
  description?: string;
  logoUrl?: string;
  ownerProfilePicture?: string;
}

type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;
type BusinessDetailsFormData = z.infer<typeof businessDetailsSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [personalData, setPersonalData] = useState<UserType | null>(null);
  const [businessData, setBusinessData] = useState<BusinessProfileType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordLogoutWarning, setShowPasswordLogoutWarning] = useState(false);
  const [showEmailLogoutWarning, setShowEmailLogoutWarning] = useState(false);
  const [pendingPasswordData, setPendingPasswordData] = useState<ChangePasswordFormData | null>(null);
  const [pendingEmailData, setPendingEmailData] = useState<ChangeEmailFormData | null>(null);
  const { user, isAuthenticated, isLoading: authLoading, role, tenantId } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extensive debugging
  console.log("🚨 PROFILE_DEBUG_INIT", { 
    timestamp: new Date().toISOString(),
    authLoading,
    isAuthenticated,
    user: user ? {
      id: user.id,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId,
      firstName: user.firstName,
      lastName: user.lastName
    } : null,
    extractedRole: role,
    extractedTenantId: tenantId,
    isOwner: role === 'owner',
    pageLocation: window.location.pathname,
    personalData: personalData ? { id: personalData.id, firstName: personalData.firstName } : null,
    businessData: businessData ? { id: businessData.id, name: businessData.name } : null,
    isLoading,
    error
  });

  // Business details form
  const businessForm = useForm<BusinessDetailsFormData>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      businessType: "",
      description: "",
    },
  });

  // Personal details form
  const personalForm = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      bio: "",
    },
  });

  // Password change form
  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Email change form
  const emailForm = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: "",
      currentPassword: "",
    },
  });

  // Business mutation
  const businessMutation = useMutation({
    mutationFn: async (data: BusinessDetailsFormData) => {
      // Add required fields for server schema compliance
      const completeData = {
        tenantId: tenantId!,
        ownerName: businessData?.ownerName || `${user?.firstName} ${user?.lastName}` || "",
        logoUrl: businessData?.logoUrl || "",
        ownerProfilePicture: businessData?.ownerProfilePicture || "",
        ...data,
      };
      const response = await apiRequest("PUT", `/api/business-profile`, completeData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Business details updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/business-profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update business details",
        variant: "destructive",
      });
    },
  });

  // Personal mutation
  const personalMutation = useMutation({
    mutationFn: async (data: PersonalDetailsFormData) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Personal details updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update personal details",
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      const response = await apiRequest("POST", "/api/users/me/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully. Redirecting to login...",
      });
      passwordForm.reset();
      setPendingPasswordData(null);
      setShowPasswordLogoutWarning(false);
      // Log out and redirect to login
      setTimeout(async () => {
        try {
          await apiRequest("POST", "/api/auth/logout");
          window.location.href = "/";
        } catch (error) {
          // If logout fails, still redirect to home
          window.location.href = "/";
        }
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
      setPendingPasswordData(null);
      setShowPasswordLogoutWarning(false);
    },
  });

  // Email change mutation
  const emailMutation = useMutation({
    mutationFn: async (data: ChangeEmailFormData) => {
      const response = await apiRequest("POST", "/api/users/me/email", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Confirmation email sent. Redirecting...",
      });
      emailForm.reset();
      setPendingEmailData(null);
      setShowEmailLogoutWarning(false);
      // Redirect to a "check your email" page
      setTimeout(() => {
        window.location.href = "/check-email?type=email-change";
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate email change",
        variant: "destructive",
      });
      setPendingEmailData(null);
      setShowEmailLogoutWarning(false);
    },
  });

  // Load data on component mount
  useEffect(() => {
    console.log("🔍 PROFILE_USEEFFECT_TRIGGERED", {
      hasUser: !!user,
      userId: user?.id,
      hasTenantId: !!tenantId,
      tenantId,
      authLoading,
      isAuthenticated,
      timestamp: new Date().toISOString()
    });

    const loadData = async () => {
      console.log("📊 PROFILE_DATA_LOADING_START", {
        userId: user?.id,
        tenantId,
        userExists: !!user?.id,
        tenantExists: !!tenantId,
        timestamp: new Date().toISOString()
      });

      if (!user?.id) {
        console.log("🚫 PROFILE_NO_USER_ID", { user });
        return;
      }

      if (!tenantId) {
        console.log("🚫 PROFILE_NO_TENANT_ID", { tenantId, user });
        return;
      }

      try {
        setIsLoading(true);
        console.log("⏳ PROFILE_LOADING_SET_TRUE");
        
        // Fetch personal data
        const personalUrl = `/api/users/${user.id}`;
        console.log("🔍 PROFILE_FETCHING_PERSONAL", { url: personalUrl, userId: user.id });
        const personalResponse = await fetch(personalUrl);
        console.log("📥 PROFILE_PERSONAL_RESPONSE", {
          status: personalResponse.status,
          ok: personalResponse.ok,
          headers: Object.fromEntries(personalResponse.headers.entries())
        });

        if (personalResponse.ok) {
          const personal = await personalResponse.json();
          console.log("✅ PROFILE_PERSONAL_SUCCESS", { 
            personal: {
              id: personal.id,
              firstName: personal.firstName,
              lastName: personal.lastName,
              email: personal.email,
              tenantId: personal.tenantId
            }
          });
          setPersonalData(personal);
          personalForm.reset({
            firstName: personal.firstName || "",
            lastName: personal.lastName || "",
            email: personal.email || "",
            phone: personal.phone || "",
            address: personal.address || "",
            bio: personal.bio || "",
          });
        } else {
          console.error("❌ PROFILE_PERSONAL_FAILED", {
            status: personalResponse.status,
            statusText: personalResponse.statusText
          });
        }

        // Fetch business data
        const businessUrl = `/api/business-profile?tenantId=${tenantId}`;
        console.log("🔍 PROFILE_FETCHING_BUSINESS", { url: businessUrl, tenantId });
        const businessResponse = await fetch(businessUrl);
        console.log("📥 PROFILE_BUSINESS_RESPONSE", {
          status: businessResponse.status,
          ok: businessResponse.ok,
          headers: Object.fromEntries(businessResponse.headers.entries())
        });

        if (businessResponse.ok) {
          const business = await businessResponse.json();
          console.log("✅ PROFILE_BUSINESS_SUCCESS", {
            business: {
              id: business.id,
              name: business.name,
              tenantId: business.tenantId,
              email: business.email
            }
          });
          setBusinessData(business);
          businessForm.reset({
            name: business.name || "",
            address: business.address || "",
            phone: business.phone || "",
            email: business.email || "",
            website: business.website || "",
            businessType: business.businessType || "",
            description: business.description || "",
          });
        } else {
          console.error("❌ PROFILE_BUSINESS_FAILED", {
            status: businessResponse.status,
            statusText: businessResponse.statusText
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error("💥 PROFILE_DATA_LOADING_ERROR", { error: err, message: errorMessage });
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
        console.log("✅ PROFILE_LOADING_SET_FALSE");
      }
    };

    loadData();
  }, [user?.id, tenantId, businessForm, personalForm]);

  const onBusinessSubmit = (data: BusinessDetailsFormData) => {
    businessMutation.mutate(data);
  };

  const onPersonalSubmit = (data: PersonalDetailsFormData) => {
    personalMutation.mutate(data);
  };

  const onPasswordSubmit = (data: ChangePasswordFormData) => {
    setPendingPasswordData(data);
    setShowPasswordLogoutWarning(true);
  };

  const onEmailSubmit = (data: ChangeEmailFormData) => {
    setPendingEmailData(data);
    setShowEmailLogoutWarning(true);
  };

  const handlePasswordConfirm = () => {
    if (pendingPasswordData) {
      passwordMutation.mutate(pendingPasswordData);
    }
  };

  const handleEmailConfirm = () => {
    if (pendingEmailData) {
      emailMutation.mutate(pendingEmailData);
    }
  };

  // Handle business logo upload
  const handleBusinessLogoChange = async (imageDataUrl: string) => {
    try {
      if (!businessData) {
        throw new Error("Business data not available");
      }

      // Send complete business profile with updated logo
      const updateData = {
        tenantId: businessData.tenantId,
        name: businessData.name,
        address: businessData.address || "",
        phone: businessData.phone || "",
        email: businessData.email || "",
        website: businessData.website || "",
        businessType: businessData.businessType || "",
        description: businessData.description || "",
        logoUrl: imageDataUrl,
      };

      const response = await apiRequest("PUT", `/api/business-profile`, updateData);
      
      if (response.ok) {
        const updatedBusiness = await response.json();
        setBusinessData(updatedBusiness);
        toast({
          title: "Success",
          description: "Business logo updated successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/business-profile"] });
      }
    } catch (error) {
      console.error("Error updating business logo:", error);
      toast({
        title: "Error",
        description: "Failed to update business logo",
        variant: "destructive",
      });
    }
  };

  // Handle personal photo upload
  const handlePersonalPhotoChange = async (imageDataUrl: string) => {
    try {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, {
        photoUrl: imageDataUrl,
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setPersonalData(updatedUser);
        toast({
          title: "Success",
          description: "Profile photo updated successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      }
    } catch (error) {
      console.error("Error updating profile photo:", error);
      toast({
        title: "Error",
        description: "Failed to update profile photo",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">
          {role === 'owner' ? 'Manage your profile and business settings' : 'Manage your account settings'}
        </p>
      </div>

      {role === 'owner' ? (
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="business" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Business</span>
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Personal</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Manage your business profile and public information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Logo Upload */}
              <div className="space-y-2">
                <Label>Business Logo</Label>
                <PhotoUpload
                  currentImage={businessData?.logoUrl}
                  onImageChange={handleBusinessLogoChange}
                  type="logo"
                />
              </div>

              <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name *</Label>
                    <Input
                      id="business-name"
                      {...businessForm.register("name")}
                      placeholder="Enter business name"
                    />
                    {businessForm.formState.errors.name && (
                      <p className="text-sm text-red-600">
                        {businessForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business-phone">Phone *</Label>
                    <Input
                      id="business-phone"
                      {...businessForm.register("phone")}
                      placeholder="Enter business phone"
                    />
                    {businessForm.formState.errors.phone && (
                      <p className="text-sm text-red-600">
                        {businessForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-address">Address *</Label>
                  <Textarea
                    id="business-address"
                    {...businessForm.register("address")}
                    placeholder="Enter business address"
                    rows={2}
                  />
                  {businessForm.formState.errors.address && (
                    <p className="text-sm text-red-600">
                      {businessForm.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-email">Email *</Label>
                    <Input
                      id="business-email"
                      type="email"
                      value={businessData?.email || ''}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="Enter business email"
                    />
                    <p className="text-xs text-muted-foreground">
                      To change your email address, please use the Security tab
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business-website">Website</Label>
                    <Input
                      id="business-website"
                      {...businessForm.register("website")}
                      placeholder="https://yourwebsite.com"
                    />
                    {businessForm.formState.errors.website && (
                      <p className="text-sm text-red-600">
                        {businessForm.formState.errors.website.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-type">Business Type</Label>
                  <Input
                    id="business-type"
                    {...businessForm.register("businessType")}
                    placeholder="e.g., Restaurant, Retail, Healthcare"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-description">Description</Label>
                  <Textarea
                    id="business-description"
                    {...businessForm.register("description")}
                    placeholder="Brief description of your business"
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={businessMutation.isPending}
                  className="w-full"
                >
                  {businessMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Business Details
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Manage your personal profile and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Photo Upload */}
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <PhotoUpload
                  currentImage={personalData?.photoUrl}
                  onImageChange={handlePersonalPhotoChange}
                  type="avatar"
                />
              </div>

              <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name *</Label>
                    <Input
                      id="first-name"
                      {...personalForm.register("firstName")}
                      placeholder="Enter first name"
                    />
                    {personalForm.formState.errors.firstName && (
                      <p className="text-sm text-red-600">
                        {personalForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name *</Label>
                    <Input
                      id="last-name"
                      {...personalForm.register("lastName")}
                      placeholder="Enter last name"
                    />
                    {personalForm.formState.errors.lastName && (
                      <p className="text-sm text-red-600">
                        {personalForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalData?.email || ''}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                    placeholder="Enter email address"
                  />
                  <p className="text-xs text-muted-foreground">
                    To change your email address, please use the Security tab
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...personalForm.register("phone")}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    {...personalForm.register("address")}
                    placeholder="Enter your address"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...personalForm.register("bio")}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={personalMutation.isPending}
                  className="w-full"
                >
                  {personalMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Personal Details
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and email settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Change Password Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </h3>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password *</Label>
                    <Input
                      id="current-password"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                      placeholder="Enter current password"
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-600">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password *</Label>
                    <Input
                      id="new-password"
                      type="password"
                      {...passwordForm.register("newPassword")}
                      placeholder="Enter new password (min 8 characters)"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-600">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password *</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                      placeholder="Confirm new password"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={passwordMutation.isPending}
                    className="w-full"
                  >
                    {passwordMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Change Password
                  </Button>
                </form>
              </div>

              {/* Change Email Section */}
              <div className="space-y-4 pt-8 border-t">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Change Email Address
                </h3>
                <p className="text-sm text-muted-foreground">
                  Current email: {personalData?.email}
                </p>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">New Email Address *</Label>
                    <Input
                      id="new-email"
                      type="email"
                      {...emailForm.register("newEmail")}
                      placeholder="Enter new email address"
                    />
                    {emailForm.formState.errors.newEmail && (
                      <p className="text-sm text-red-600">
                        {emailForm.formState.errors.newEmail.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-password">Current Password *</Label>
                    <Input
                      id="email-password"
                      type="password"
                      {...emailForm.register("currentPassword")}
                      placeholder="Enter current password to confirm"
                    />
                    {emailForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-600">
                        {emailForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={emailMutation.isPending}
                    className="w-full"
                  >
                    {emailMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Confirmation Email
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      ) : (
        /* Staff Profile - Personal Details and Security */
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Personal</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Manage your personal profile and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo Upload */}
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <PhotoUpload
                    currentImage={personalData?.photoUrl}
                    onImageChange={handlePersonalPhotoChange}
                    type="avatar"
                  />
                </div>

                <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff-firstName">First Name *</Label>
                      <Input
                        id="staff-firstName"
                        {...personalForm.register("firstName")}
                        placeholder="Enter first name"
                      />
                      {personalForm.formState.errors.firstName && (
                        <p className="text-sm text-red-600">
                          {personalForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staff-lastName">Last Name *</Label>
                      <Input
                        id="staff-lastName"
                        {...personalForm.register("lastName")}
                        placeholder="Enter last name"
                      />
                      {personalForm.formState.errors.lastName && (
                        <p className="text-sm text-red-600">
                          {personalForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-email">Email Address *</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      value={personalData?.email || ''}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="Enter email address"
                    />
                    <p className="text-xs text-muted-foreground">
                      To change your email address, please use the Security tab
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-phone">Phone</Label>
                    <Input
                      id="staff-phone"
                      {...personalForm.register("phone")}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-address">Address</Label>
                    <Textarea
                      id="staff-address"
                      {...personalForm.register("address")}
                      placeholder="Enter your address"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-bio">Bio</Label>
                    <Textarea
                      id="staff-bio"
                      {...personalForm.register("bio")}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={personalMutation.isPending}
                    className="w-full"
                  >
                    {personalMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and email settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Change Password Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </h3>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff-current-password">Current Password *</Label>
                      <Input
                        id="staff-current-password"
                        type="password"
                        {...passwordForm.register("currentPassword")}
                        placeholder="Enter current password"
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-600">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staff-new-password">New Password *</Label>
                      <Input
                        id="staff-new-password"
                        type="password"
                        {...passwordForm.register("newPassword")}
                        placeholder="Enter new password (min 8 characters)"
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-600">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staff-confirm-password">Confirm New Password *</Label>
                      <Input
                        id="staff-confirm-password"
                        type="password"
                        {...passwordForm.register("confirmPassword")}
                        placeholder="Confirm new password"
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={passwordMutation.isPending}
                      className="w-full"
                    >
                      {passwordMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Change Password
                    </Button>
                  </form>
                </div>

                {/* Change Email Section */}
                <div className="space-y-4 pt-8 border-t">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Change Email Address
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Current email: {personalData?.email}
                  </p>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff-new-email">New Email Address *</Label>
                      <Input
                        id="staff-new-email"
                        type="email"
                        {...emailForm.register("newEmail")}
                        placeholder="Enter new email address"
                      />
                      {emailForm.formState.errors.newEmail && (
                        <p className="text-sm text-red-600">
                          {emailForm.formState.errors.newEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staff-email-password">Current Password *</Label>
                      <Input
                        id="staff-email-password"
                        type="password"
                        {...emailForm.register("currentPassword")}
                        placeholder="Enter current password to confirm"
                      />
                      {emailForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-600">
                          {emailForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={emailMutation.isPending}
                      className="w-full"
                    >
                      {emailMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Send Confirmation Email
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Password Change Warning Dialog */}
      <AlertDialog open={showPasswordLogoutWarning} onOpenChange={setShowPasswordLogoutWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password Change Warning</AlertDialogTitle>
            <AlertDialogDescription>
              After changing your password, you will be automatically logged out for security reasons. 
              You'll need to log in again with your new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowPasswordLogoutWarning(false);
              setPendingPasswordData(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordConfirm}>
              Change Password & Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Change Warning Dialog */}
      <AlertDialog open={showEmailLogoutWarning} onOpenChange={setShowEmailLogoutWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email Change Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              We'll send a confirmation email to your new address. You'll be redirected to a confirmation page. 
              Please check your email and click the confirmation link to complete the email change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowEmailLogoutWarning(false);
              setPendingEmailData(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEmailConfirm}>
              Send Confirmation Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}