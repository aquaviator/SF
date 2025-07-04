import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Users, ArrowRight, X, CheckCircle } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EscalationItem {
  id: number;
  type: string;
  description: string;
  affectedShifts: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
}

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  escalations: EscalationItem[];
  tenantId: string;
}

export function EscalationModal({ isOpen, onClose, escalations, tenantId }: EscalationModalProps) {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { toast } = useToast();

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'outline';
    }
  };

  const handleReassignShift = async (escalationId: number) => {
    console.log("🔄 ESCALATION_REASSIGN", { escalationId, tenantId, timestamp: new Date() });
    
    setProcessingId(escalationId);
    
    try {
      // For coverage gaps, we need to create an opportunity or alert management
      const response = await apiRequest("POST", `/api/escalations/${escalationId}/reassign`, {
        tenantId,
        action: "create_opportunity",
        priority: "urgent"
      });

      if (response.ok) {
        toast({
          title: "Escalation Handled",
          description: "Shift has been converted to high-priority opportunity",
        });
        
        console.log("✅ ESCALATION_REASSIGN_SUCCESS", { escalationId, timestamp: new Date() });
      } else {
        throw new Error("Failed to reassign shift");
      }
    } catch (error) {
      console.error("❌ ESCALATION_REASSIGN_FAILED", { escalationId, error, timestamp: new Date() });
      toast({
        title: "Error",
        description: "Failed to handle escalation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotifyStaff = async (escalationId: number) => {
    console.log("📢 ESCALATION_NOTIFY", { escalationId, tenantId, timestamp: new Date() });
    
    setProcessingId(escalationId);
    
    try {
      const response = await apiRequest("POST", `/api/escalations/${escalationId}/notify`, {
        tenantId,
        action: "broadcast_urgent",
        message: "Urgent shift coverage needed"
      });

      if (response.ok) {
        toast({
          title: "Staff Notified",
          description: "Urgent notification sent to all available staff",
        });
        
        console.log("✅ ESCALATION_NOTIFY_SUCCESS", { escalationId, timestamp: new Date() });
      } else {
        throw new Error("Failed to notify staff");
      }
    } catch (error) {
      console.error("❌ ESCALATION_NOTIFY_FAILED", { escalationId, error, timestamp: new Date() });
      toast({
        title: "Error", 
        description: "Failed to notify staff. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (escalationId: number) => {
    console.log("✖️ ESCALATION_DISMISS", { escalationId, tenantId, timestamp: new Date() });
    
    setProcessingId(escalationId);
    
    try {
      const response = await apiRequest("POST", `/api/escalations/${escalationId}/dismiss`, {
        tenantId,
        reason: "manually_resolved"
      });

      if (response.ok) {
        toast({
          title: "Escalation Dismissed",
          description: "Escalation has been marked as resolved",
        });
        
        console.log("✅ ESCALATION_DISMISS_SUCCESS", { escalationId, timestamp: new Date() });
      } else {
        throw new Error("Failed to dismiss escalation");
      }
    } catch (error) {
      console.error("❌ ESCALATION_DISMISS_FAILED", { escalationId, error, timestamp: new Date() });
      toast({
        title: "Error",
        description: "Failed to dismiss escalation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Escalation Management
          </DialogTitle>
          <DialogDescription>
            Handle urgent operational issues that require immediate attention
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {escalations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Escalations</h3>
              <p className="text-muted-foreground">
                All operational issues are currently resolved
              </p>
            </div>
          ) : (
            escalations.map((escalation) => (
              <Card key={escalation.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={getUrgencyColor(escalation.urgency)}>
                          {escalation.urgency}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {escalation.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(escalation.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{escalation.description}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {escalation.affectedShifts} shift{escalation.affectedShifts !== 1 ? 's' : ''} affected
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReassignShift(escalation.id)}
                        disabled={processingId === escalation.id}
                        className="min-h-[44px]"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Create Opportunity
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNotifyStaff(escalation.id)}
                        disabled={processingId === escalation.id}
                        className="min-h-[44px]"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Notify Staff
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(escalation.id)}
                        disabled={processingId === escalation.id}
                        className="min-h-[44px]"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}