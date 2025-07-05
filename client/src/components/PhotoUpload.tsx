import React, { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  currentImage?: string | null;
  onImageChange?: (imageUrl: string) => void;
  onFileSelect?: (file: File) => void;
  type: 'logo' | 'avatar';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function PhotoUpload({
  currentImage,
  onImageChange,
  onFileSelect,
  type,
  className,
  size = 'md',
  isLoading = false
}: PhotoUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeConfig = {
    sm: { container: 'w-16 h-16', preview: 'w-16 h-16', icon: 'w-4 h-4', text: 'text-xs' },
    md: { container: 'w-24 h-24', preview: 'w-24 h-24', icon: 'w-5 h-5', text: 'text-sm' },
    lg: { container: 'w-32 h-32', preview: 'w-32 h-32', icon: 'w-6 h-6', text: 'text-base' },
  };
  const config = sizeConfig[size];

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file (JPG, PNG, GIF, etc.)", variant: "destructive" });
      return;
    }
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image smaller than 5MB", variant: "destructive" });
      return;
    }
    
    // Raw file flow - if onFileSelect is provided, use it instead of Base64
    if (onFileSelect) {
      onFileSelect(file);
      return;
    }
    
    // Fallback: Base64 preview for legacy usage
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onImageChange?.(base64);
        toast({ title: "Photo uploaded", description: `${type === 'logo' ? 'Business logo' : 'Profile photo'} updated successfully` });
      };
      reader.onerror = () => {
        toast({ title: "Upload failed", description: "Failed to read the image file", variant: "destructive" });
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "Upload failed", description: "An error occurred while uploading the image", variant: "destructive" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };
  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <div className={cn("space-y-2", className)}>
      <Label className={config.text}>{type === 'logo' ? 'Business Logo' : 'Profile Photo'}</Label>
      <div className="flex items-center gap-4">
        <div className={cn(config.container, "relative rounded-lg border-2 border-dashed overflow-hidden flex items-center justify-center bg-gray-50", dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300")}
             onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={e => { e.preventDefault(); setDragOver(false) }}
             onClick={triggerFileInput}>
          {currentImage
            ? <img src={currentImage} alt="uploaded" className={cn(config.preview, "object-cover")} />
            : <Camera className={cn(config.icon, "text-gray-400")} />
          }
          {isLoading && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Loader2 className={cn(config.icon, "animate-spin text-white")} /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" disabled={isLoading} />
          <Button variant="outline" size="sm" onClick={triggerFileInput} disabled={isLoading} className="w-full">
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Uploading...</> : <><Upload className="w-4 h-4 mr-2"/>Choose File</>}
          </Button>
        </div>
      </div>
    </div>
  );
}