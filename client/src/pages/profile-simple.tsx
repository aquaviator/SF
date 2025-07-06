import React, { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserType {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string | null;
}
export default function ProfileSimple() {
  const { user } = useRole();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (user?.id) {
      apiRequest('GET', `/api/users/${user.id}`)
        .then(response => response.json())
        .then(data => {
          console.log('Profile data loaded:', data);
          setUserData(data as UserType);
          setPhotoUrl(data.photoUrl);
          setLoading(false);
        })
        .catch(error => {
          console.error('Profile fetch error:', error);
        });
    }
  }, [user?.id]);
  const updatePhoto = async (imageUrl: string) => {
    console.log('🔄 UPDATING_PHOTO', { imageUrl: imageUrl.substring(0, 50) + '...' });
    
    if (!userData || !user?.id) {
      console.log('❌ NO_USER_DATA');
      return;
    try {
      const updateData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        photoUrl: imageUrl
      };
      console.log('🚀 SENDING_UPDATE', { hasPhotoUrl: !!updateData.photoUrl });
      
      const response = await apiRequest('PUT', `/api/users/${user.id}`, updateData);
      const result = await response.json();
      console.log('✅ UPDATE_SUCCESS', result);
      setPhotoUrl(imageUrl);
      setUserData(prev => prev ? { ...prev, photoUrl: imageUrl } : null);
      toast({ 
        title: "Success", 
        description: "Profile photo updated successfully" 
      });
    } catch (error) {
      console.error('❌ UPDATE_ERROR', error);
        title: "Error", 
        description: "Failed to update profile photo", 
        variant: "destructive" 
  };
  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Photo Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUpload
            type="avatar"
            currentImage={photoUrl}
            onImageChange={updatePhoto}
            size="lg"
          />
          
          <div className="mt-4 text-sm text-gray-600">
            <p>User: {userData?.firstName} {userData?.lastName}</p>
            <p>Current photo URL: {photoUrl ? 'Set' : 'None'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
