import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DeleteUserModalProps {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (response: { userDeleted: boolean }) => void;
}

export function DeleteUserModal({ user, isOpen, onClose, onDeleted }: DeleteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('DELETE', `/api/admin/users/${user.id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete user');
      }
      
      toast({
        title: "User Permanently Deleted",
        description: `${user.firstName} ${user.lastName} has been permanently removed from the database.`,
      });
      
      onDeleted(result);
      onClose();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Permanently Delete User
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">⚠️ Warning: This action cannot be undone!</p>
              <ul className="list-disc list-inside space-y-1">
                <li>User will be permanently removed from database</li>
                <li>All historical data will be lost</li>
                <li>This action is irreversible</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">You are about to permanently delete:</p>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-red-600 font-medium mt-1">Status: Inactive (Off-boarded)</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}