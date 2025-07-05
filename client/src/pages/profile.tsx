import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Building2, User, Mail, Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Business Details Schema
const businessDetailsSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  address: z.string().min(1, "Business address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  website: z.string().url("Valid website URL is required").optional().or(z.literal("")),
  businessType: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
});

// Personal/Owner Details Schema
const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
});

type BusinessDetailsFormData = z.infer<typeof businessDetailsSchema>;
type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

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

export default function Profile() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users", user?.id],
    queryFn: () => fetch(`/api/users/${user?.id}`).then((res) => res.json()),
    enabled: !!user?.id,
  });

  // Fetch business profile data (for owners only)
  const { data: businessData, isLoading: businessLoading } = useQuery({
    queryKey: ["/api/business-profile", user?.tenantId],
    queryFn: () => fetch(`/api/business-profile?tenantId=${user?.tenantId}`).then((res) => res.json()),
    enabled: !!user?.tenantId && role === "owner",
  });

  // Business Details Form
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
      logoUrl: "",
    },
  });

  // Personal Details Form
  const personalForm = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      bio: "",
      photoUrl: "",
    },
  });

  // Load data into forms when available
  useEffect(() => {
    if (userData) {
      console.log('Personal profile data loaded:', userData);
      personalForm.reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
        bio: userData.bio || "",
        photoUrl: userData.photoUrl || "",
      });
    }
  }, [userData, personalForm]);

  useEffect(() => {
    if (businessData && role === "owner") {
      console.log('Business profile data loaded:', businessData);
      businessForm.reset({
        name: businessData.name || "",
        address: businessData.address || "",
        phone: businessData.phone || "",
        email: businessData.email || "",
        website: businessData.website || "",
        businessType: businessData.businessType || "",
        description: businessData.description || "",
        logoUrl: businessData.logoUrl || "",
      });
    }
  }, [businessData, businessForm, role]);

  useEffect(() => {
    if (!userLoading && (!businessLoading || role !== "owner")) {
      setLoading(false);
    }
  }, [userLoading, businessLoading, role]);

  // Business Details Update Mutation
  const businessMutation = useMutation({
    mutationFn: async (data: BusinessDetailsFormData) => {
      const response = await apiRequest('PUT', `/api/business-profile`, {
        ...data,
        tenantId: user?.tenantId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-profile"] });
      toast({ title: "Success", description: "Business details updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update business details", variant: "destructive" });
    }
  });

  // Personal Details Update Mutation
  const personalMutation = useMutation({
    mutationFn: async (data: PersonalDetailsFormData) => {
      const response = await apiRequest('PUT', `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      toast({ title: "Success", description: "Personal details updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update personal details", variant: "destructive" });
    }
  });

  const onBusinessSubmit = (data: BusinessDetailsFormData) => {
    businessMutation.mutate(data);
  };

  const onPersonalSubmit = (data: PersonalDetailsFormData) => {
    personalMutation.mutate(data);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            {role === "owner" 
              ? "Manage your business and personal profile settings"
              : "Manage your personal profile and account settings"
            }
          </p>
        </div>
      </div>

      {role === "owner" ? (
        // Owner Profile with Business and Personal tabs
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="business">Business Details</TabsTrigger>
            <TabsTrigger value="personal">Owner Details</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...businessForm}>
                  <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={businessForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter business name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={businessForm.control}
                        name="businessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Type</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Restaurant, Retail, Services" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={businessForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="business@example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={businessForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(555) 123-4567" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={businessForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={businessForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter complete business address" rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Business Logo */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Business Logo</label>
                      <div className="mt-2">
                        <PhotoUpload
                          type="logo"
                          currentImage={businessForm.watch("logoUrl")}
                          onImageChange={(imageUrl) => businessForm.setValue("logoUrl", imageUrl)}
                          size="lg"
                        />
                      </div>
                    </div>

                    <FormField
                      control={businessForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe your business" rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={businessMutation.isPending}>
                        {businessMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Business Details
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Owner Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...personalForm}>
                  <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-6">
                    {/* Owner Profile Photo */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Owner Photo</label>
                      <div className="mt-2">
                        <PhotoUpload
                          type="avatar"
                          currentImage={personalForm.watch("photoUrl")}
                          onImageChange={(imageUrl) => personalForm.setValue("photoUrl", imageUrl)}
                          size="lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={personalForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter first name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter last name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="personal@example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(555) 123-4567" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={personalForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter your address" rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={personalForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Tell us about yourself" rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{userData?.role}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Current Role
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={personalMutation.isPending}>
                        {personalMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Owner Details
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Staff Profile - Personal details only
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...personalForm}>
              <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-6">
                {/* Staff Profile Photo */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Profile Photo</label>
                  <div className="mt-2">
                    <PhotoUpload
                      type="avatar"
                      currentImage={personalForm.watch("photoUrl")}
                      onImageChange={(imageUrl) => personalForm.setValue("photoUrl", imageUrl)}
                      size="lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={personalForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter first name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter last name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="email@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={personalForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter your address" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Tell us about yourself" rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{userData?.role}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Current Role
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={personalMutation.isPending}>
                    {personalMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}