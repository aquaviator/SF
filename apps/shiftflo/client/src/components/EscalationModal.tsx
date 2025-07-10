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

  const handleSystemWideAlert = async (escalationId: number) => {
    console.log("📢 ESCALATION_SYSTEM_WIDE_ALERT", { escalationId, tenantId, timestamp: new Date() });
    
    setProcessingId(escalationId);
    
    try {
      // Send urgent system-wide notification to ALL staff members
      const response = await apiRequest("POST", `/api/escalations/${escalationId}/system-alert`, {
        tenantId,
        action: "urgent_broadcast",
        priority: "critical"
      });

      if (response.ok) {
        toast({
          title: "System-Wide Alert Sent",
          description: "Urgent notification broadcast to all staff members",
        });
        
        console.log("✅ ESCALATION_SYSTEM_ALERT_SUCCESS", { escalationId, timestamp: new Date() });
      } else {
        throw new Error("Failed to send system-wide alert");
      }
    } catch (error) {
      console.error("❌ ESCALATION_SYSTEM_ALERT_FAILED", { escalationId, error, timestamp: new Date() });
      toast({
        title: "Error",
        description: "Failed to send system-wide alert. Please try again.",
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
                    
                    <div className="flex flex-col gap-2">
                      {escalation.type === "assignment_declined" && (
                        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded border-l-4 border-blue-400">
                          <span className="font-medium">✓ Auto-handled:</span> Opportunity created automatically when declined outside policy window
                        </div>
                      )}
                      
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSystemWideAlert(escalation.id)}
                        disabled={processingId === escalation.id}
                        className="min-h-[44px]"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {processingId === escalation.id ? "Broadcasting..." : "Send System-Wide Alert"}
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