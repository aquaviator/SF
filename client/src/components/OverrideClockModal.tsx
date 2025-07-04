import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface TimeEntry {
  id: number;
  clockInTime: string | Date | null;
  clockOutTime: string | Date | null;
  scheduledStartTime?: string | Date | null;
  scheduledEndTime?: string | Date | null;
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
  
  // Format date for input type="date"
  const formatDate = (timestamp: string | Date | null): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  };

  // Format time for input type="time"
  const formatTime = (timestamp: string | Date | null): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toTimeString().slice(0, 5);
  };

  // Get default values from actualIn/actualOut or fall back to scheduled times
  const getDefaultInDate = () => {
    return formatDate(entry.clockInTime || entry.scheduledStartTime);
  };

  const getDefaultInTime = () => {
    return formatTime(entry.clockInTime || entry.scheduledStartTime);
  };

  const getDefaultOutDate = () => {
    return formatDate(entry.clockOutTime || entry.scheduledEndTime);
  };

  const getDefaultOutTime = () => {
    return formatTime(entry.clockOutTime || entry.scheduledEndTime);
  };

  const [formData, setFormData] = useState({
    inDate: getDefaultInDate(),
    inTime: getDefaultInTime(),
    outDate: getDefaultOutDate(),
    outTime: getDefaultOutTime(),
    reason: "",
    otherNote: ""
  });

  const reasonOptions = [
    "Late arrival",
    "Early departure", 
    "Forgot to clock out",
    "Other"
  ];

  const isFormValid = () => {
    const hasBasicFields = formData.inDate && formData.inTime && formData.outDate && formData.outTime && formData.reason;
    const hasValidReason = formData.reason !== "Other" || (formData.reason === "Other" && formData.otherNote.trim());
    return hasBasicFields && hasValidReason;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Combine date and time into ISO format
    const inDateTime = `${formData.inDate}T${formData.inTime}:00`;
    const outDateTime = `${formData.outDate}T${formData.outTime}:00`;

    if (new Date(inDateTime) >= new Date(outDateTime)) {
      toast({
        title: "Error", 
        description: "Clock out time must be after clock in time",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/time-entries/${entry.id}/override`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          in: inDateTime,
          out: outDateTime,
          note: formData.reason === "Other" ? formData.otherNote : formData.reason
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
          {/* Clock In Date & Time */}
          <div className="space-y-2">
            <Label>Clock In</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={formData.inDate}
                onChange={(e) => setFormData(prev => ({ ...prev, inDate: e.target.value }))}
                required
                className="flex-1"
              />
              <Input
                type="time"
                value={formData.inTime}
                onChange={(e) => setFormData(prev => ({ ...prev, inTime: e.target.value }))}
                required
                className="flex-1"
              />
            </div>
          </div>

          {/* Clock Out Date & Time */}
          <div className="space-y-2">
            <Label>Clock Out</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={formData.outDate}
                onChange={(e) => setFormData(prev => ({ ...prev, outDate: e.target.value }))}
                required
                className="flex-1"
              />
              <Input
                type="time"
                value={formData.outTime}
                onChange={(e) => setFormData(prev => ({ ...prev, outTime: e.target.value }))}
                required
                className="flex-1"
              />
            </div>
          </div>

          {/* Reason Selector */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasonOptions.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Other Note (shown when "Other" is selected) */}
          {formData.reason === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="otherNote">Please specify</Label>
              <Textarea
                id="otherNote"
                placeholder="Explain the reason for this override..."
                value={formData.otherNote}
                onChange={(e) => setFormData(prev => ({ ...prev, otherNote: e.target.value }))}
                required
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !isFormValid()}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}