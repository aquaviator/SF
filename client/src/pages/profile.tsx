import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModalForm } from "@/components/ModalForm";
import { PhotoUpload } from "@/components/PhotoUpload";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, User, Mail, Loader2, Clock, Upload, Camera, X, AlertCircle, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  photoUrl: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [userData, setUserData] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  


  useEffect(() => {
    if (user?.id) {
      apiRequest('GET', `/api/users/${user.id}`)
        .then(response => response.json())
        .then(data => {
          console.log('Profile data loaded:', data);
          setUserData(data as UserType);
        })
        .catch(error => {
          console.error('Profile fetch error:', error);
          toast({
            title: "Error",
            description: `Failed to load profile data: ${error.message}`,
            variant: "destructive",
          });
        })
        .finally(() => setLoading(false));
    }
  }, [user?.id, toast]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  // Reset form when user data loads
  useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email,
        photoUrl: userData.photoUrl || "",
      });
    }
  }, [userData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!userData) throw new Error("User data not loaded");
      
      // Merge form data with existing user data to send all required fields
      const fullUpdateData = {
        username: userData.username,
        password: userData.password,
        role: userData.role,
        tenantId: userData.tenantId,
        isActive: userData.isActive,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        photoUrl: data.photoUrl,
      };
      
      console.log('🚀 API_REQUEST_PAYLOAD', { 
        endpoint: `/api/users/${user?.id}`, 
        hasPhotoUrl: !!fullUpdateData.photoUrl,
        photoUrlLength: fullUpdateData.photoUrl?.length,
        photoUrlPreview: fullUpdateData.photoUrl?.substring(0, 50) + '...'
      });
      
      return apiRequest("PUT", `/api/users/${user?.id}`, fullUpdateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsModalOpen(false);
      // Invalidate sidebar cache to show updated data
      console.log('🔄 CACHE_INVALIDATION', { 
        queryKey: ["/api/users", user?.id],
        userId: user?.id 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Track photo upload state
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

  // Initialize currentPhotoUrl when userData loads
  useEffect(() => {
    if (userData?.photoUrl && !currentPhotoUrl) {
      setCurrentPhotoUrl(userData.photoUrl);
    }
  }, [userData?.photoUrl, currentPhotoUrl]);





  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  // Show loading spinner until data is ready
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Loading Profile...</h2>
          <p className="text-gray-600">Please wait while we fetch your information.</p>
        </div>
      </div>
    );
  }

  // Show error if failed to load profile
  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Failed to load profile</h2>
          <p className="text-gray-600">Unable to fetch profile data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>
          <p className="text-gray-600">Manage your personal information and availability</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Photo Section */}
            <div>
              <label className="text-sm font-medium text-gray-500">Profile Photo</label>
              <div className="mt-2">
                <PhotoUpload
                  type="avatar"
                  currentImage={currentPhotoUrl || userData?.photoUrl}
                  onImageChange={(imageUrl) => {
                    console.log('🔄 AVATAR_UPLOAD_CALLBACK', { 
                      userId: user?.id,
                      hasUserData: !!userData,
                      imageUrlLength: imageUrl?.length,
                      imageUrlPreview: imageUrl?.substring(0, 50) + '...'
                    });
                    
                    setCurrentPhotoUrl(imageUrl);
                    
                    // Update profile immediately with Base64 image
                    if (userData && user?.id) {
                      const updateData = {
                        firstName: userData.firstName || "",
                        lastName: userData.lastName || "",
                        email: userData.email,
                        photoUrl: imageUrl
                      };
                      
                      console.log('🚀 API_REQUEST_PAYLOAD', {
                        endpoint: `/api/users/${user.id}`,
                        hasPhotoUrl: !!updateData.photoUrl,
                        photoUrlLength: updateData.photoUrl?.length,
                        photoUrlPreview: updateData.photoUrl?.substring(0, 50) + '...'
                      });
                      
                      updateMutation.mutate(updateData);
                    } else {
                      console.log('❌ AVATAR_UPLOAD_BLOCKED', {
                        hasUserData: !!userData,
                        hasUserId: !!user?.id
                      });
                    }
                  }}
                  size="md"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-lg font-medium">
                {userData?.firstName} {userData?.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <div className="flex items-center mt-1">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <p>{userData?.email}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <div className="mt-1">
                <Badge variant="secondary">
                  {userData?.role === "staff" ? "Staff Member" : "Owner"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Work Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Employee ID</label>
              <p className="text-lg font-medium">{userData?.employeeId || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <div className="flex items-center mt-1">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <Badge variant="outline" className="capitalize">
                  {userData?.role}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Hire Date</label>
              <p className="text-lg font-medium">
                {userData?.hireDate ? new Date(userData.hireDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="flex items-center mt-1">
                <Badge variant={userData?.isActive ? "default" : "secondary"}>
                  {userData?.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Profile Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Phone Number</label>
              <p className="text-lg font-medium">{userData?.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-sm text-gray-700">{userData?.address || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              <p className="text-lg font-medium">
                {userData?.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Contact Name</label>
              <p className="text-lg font-medium">{userData?.emergencyContactName || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Contact Phone</label>
              <p className="text-lg font-medium">{userData?.emergencyContactPhone || 'Not provided'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bio Section */}
      {userData?.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              About Me
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{userData.bio}</p>
          </CardContent>
        </Card>
      )}

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Profile"
        form={form}
        onSubmit={onSubmit}
        submitLabel="Update Profile"
        isLoading={updateMutation.isPending}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Profile Photo</FormLabel>
            <div className="mt-2">
              <PhotoUpload
                type="avatar"
                currentImage={form.watch("photoUrl")}
                onImageChange={(imageUrl) => form.setValue("photoUrl", imageUrl)}
                size="md"
              />
            </div>
          </div>

        </div>
      </ModalForm>
    </div>
  );
}