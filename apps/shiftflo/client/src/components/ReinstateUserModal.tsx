import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserCheck, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReinstateUserModalProps {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onReinstated: (response: { userReactivated: boolean; message: string }) => void;
}

export function ReinstateUserModal({ user, isOpen, onClose, onReinstated }: ReinstateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleReinstate = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('PATCH', `/api/admin/users/${user.id}/reinstate`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to reinstate user');
      }
      
      toast({
        title: "User Reinstated",
        description: result.message || `${user.firstName} ${user.lastName} has been successfully reinstated.`,
      });
      
      onReinstated(result);
      onClose();
    } catch (error) {
      console.error("Error reinstating user:", error);
      toast({
        title: "Reinstatement Failed",
        description: error instanceof Error ? error.message : "Failed to reinstate user",
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
            <UserCheck className="h-5 w-5 text-green-600" />
            Reinstate Staff Member
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">This action will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Reactivate the user account</li>
                <li>Restore access to the system</li>
                <li>Allow them to be assigned to shifts again</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">You are about to reinstate:</p>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
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
              onClick={handleReinstate}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Reinstating..." : "Reinstate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}