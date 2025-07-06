import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, UserX } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OffboardUserModalProps {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onOffboarded: (response: { shiftsUpdated: number; userDeactivated: boolean }) => void;
}
export function OffboardUserModal({ user, isOpen, onClose, onOffboarded }: OffboardUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const handleOffboard = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('PATCH', `/api/admin/users/${user.id}/offboard`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to off-board user');
      }
      toast({
        title: "User Off-boarded",
        description: `${user.firstName} ${user.lastName} has been successfully off-boarded. ${result.shiftsUpdated} upcoming shifts were unassigned.`,
      });
      onOffboarded(result);
      onClose();
    } catch (error) {
      console.error("Error off-boarding user:", error);
        title: "Off-boarding Failed",
        description: error instanceof Error ? error.message : "Failed to off-board user",
        variant: "destructive",
    } finally {
      setIsLoading(false);
    }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-600" />
            Off-board Staff Member
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Warning: This action will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Deactivate the user account</li>
                <li>Unassign all upcoming shifts</li>
                <li>Set affected shifts to "open" status</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">You are about to off-board:</p>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
              variant="destructive"
              onClick={handleOffboard}
              {isLoading ? "Off-boarding..." : "Confirm Off-board"}
        </div>
      </DialogContent>
    </Dialog>
  );
