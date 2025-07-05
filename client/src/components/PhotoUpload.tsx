import React, { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string) => void;
  type: 'logo' | 'avatar';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PhotoUpload({ 
  currentImage, 
  onImageChange, 
  type, 
  className, 
  size = 'md' 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-16 h-16',
      preview: 'w-16 h-16',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      container: 'w-24 h-24',
      preview: 'w-24 h-24',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    lg: {
      container: 'w-32 h-32',
      preview: 'w-32 h-32',
      icon: 'w-6 h-6',
      text: 'text-base'
    }
  };

  const config = sizeConfig[size];

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Convert to base64 for now (in production, upload to cloud storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onImageChange(base64);
        setUploading(false);
        
        toast({
          title: "Photo uploaded",
          description: `${type === 'logo' ? 'Business logo' : 'Profile photo'} updated successfully`
        });
      };
      reader.onerror = () => {
        setUploading(false);
        toast({
          title: "Upload failed",
          description: "Failed to read the image file",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the image",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Photo removed",
      description: `${type === 'logo' ? 'Business logo' : 'Profile photo'} removed successfully`
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className={config.text}>
        {type === 'logo' ? 'Business Logo' : 'Profile Photo'}
      </Label>
      
      <div className="flex items-center gap-4">
        {/* Current Image Preview */}
        <div className={cn(
          config.container,
          "relative rounded-lg border-2 border-dashed border-gray-300 overflow-hidden",
          "flex items-center justify-center bg-gray-50",
          currentImage ? "border-solid border-gray-200" : "",
          dragOver ? "border-blue-400 bg-blue-50" : ""
        )}>
          {currentImage ? (
            <>
              <img
                src={currentImage}
                alt={type === 'logo' ? 'Business logo' : 'Profile photo'}
                className={cn(config.preview, "object-cover")}
              />
              {!uploading && (
                <button
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  aria-label="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <div className="text-center">
              {uploading ? (
                <Loader2 className={cn(config.icon, "animate-spin text-gray-400")} />
              ) : (
                <Camera className={cn(config.icon, "text-gray-400")} />
              )}
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Loader2 className={cn(config.icon, "animate-spin text-white")} />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2">
          <div
            className={cn(
              "border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer transition-colors",
              dragOver ? "border-blue-400 bg-blue-50" : "hover:border-gray-400",
              uploading ? "pointer-events-none opacity-50" : ""
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={triggerFileInput}
          >
            <Upload className={cn(config.icon, "mx-auto mb-2 text-gray-400")} />
            <p className={cn(config.text, "text-gray-600")}>
              Drop image here or click to upload
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, GIF up to 5MB
            </p>
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={uploading}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}