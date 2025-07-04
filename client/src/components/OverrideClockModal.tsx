import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TimeEntry {
  id: number;
  clockInTime: string | Date | null;
  clockOutTime: string | Date | null;
  userId: number;
  tenantId: string;
  status: string;
}

interface OverrideClockModalProps {
  entry: TimeEntry;
  onClose: () => void;
  onSaved: (updatedEntry: TimeEntry) => void;
}

export function OverrideClockModal({ entry, onClose, onSaved }: OverrideClockModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Convert timestamps to datetime-local format
  const formatForInput = (timestamp: string | Date | null): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    // Return in YYYY-MM-DDTHH:mm format for datetime-local input
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    clockIn: formatForInput(entry.clockInTime),
    clockOut: formatForInput(entry.clockOutTime),
    note: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clockIn || !formData.clockOut || !formData.note.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (new Date(formData.clockIn) >= new Date(formData.clockOut)) {
      toast({
        title: "Error", 
        description: "Clock out time must be after clock in time",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest(`/api/time-entries/${entry.id}/override`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          in: formData.clockIn,
          out: formData.clockOut,
          note: formData.note
        })
      });

      if (!response.ok) {
        throw new Error("Failed to override time entry");
      }

      const updatedEntry = await response.json();
      
      toast({
        title: "Success",
        description: "Time entry has been overridden"
      });

      onSaved(updatedEntry);
      onClose();
    } catch (error) {
      console.error("Override time entry error:", error);
      toast({
        title: "Error",
        description: "Failed to override time entry",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Override Clock Times</DialogTitle>
          <DialogDescription>
            Manually adjust the clock-in and clock-out times for this time entry. 
            This action will be logged for audit purposes.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clockIn">Clock In Time</Label>
            <Input
              id="clockIn"
              type="datetime-local"
              value={formData.clockIn}
              onChange={(e) => setFormData(prev => ({ ...prev, clockIn: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clockOut">Clock Out Time</Label>
            <Input
              id="clockOut"
              type="datetime-local"
              value={formData.clockOut}
              onChange={(e) => setFormData(prev => ({ ...prev, clockOut: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Override Note</Label>
            <Textarea
              id="note"
              placeholder="Explain why this override is necessary..."
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              required
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Override"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}