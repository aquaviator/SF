import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Building } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  address: string;
  phone: string;
  email: string;
  website?: string;
  businessType?: string;
  description?: string;
  logoUrl?: string;
}

type BusinessDetailsFormData = z.infer<typeof businessDetailsSchema>;
type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [personalData, setPersonalData] = useState<UserType | null>(null);
  const [businessData, setBusinessData] = useState<BusinessProfileType | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  // Business mutation
  const businessMutation = useMutation({
    mutationFn: async (data: BusinessDetailsFormData) => {
      const response = await apiRequest("PUT", `/api/business-profile?tenantId=${tenantId}`, data);
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

  // Handle business logo upload
  const handleBusinessLogoChange = async (imageDataUrl: string) => {
    try {
      const response = await apiRequest("PUT", `/api/business-profile?tenantId=${tenantId}`, {
        logoUrl: imageDataUrl,
      });
      
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="business" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Business Details</span>
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Owner Details</span>
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
                      {...businessForm.register("email")}
                      placeholder="Enter business email"
                    />
                    {businessForm.formState.errors.email && (
                      <p className="text-sm text-red-600">
                        {businessForm.formState.errors.email.message}
                      </p>
                    )}
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
                    {...personalForm.register("email")}
                    placeholder="Enter email address"
                  />
                  {personalForm.formState.errors.email && (
                    <p className="text-sm text-red-600">
                      {personalForm.formState.errors.email.message}
                    </p>
                  )}
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
        </Tabs>
      ) : (
        /* Staff Profile - Personal Details Only */
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
                  {...personalForm.register("email")}
                  placeholder="Enter email address"
                />
                {personalForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {personalForm.formState.errors.email.message}
                  </p>
                )}
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
      )}
    </div>
  );
}