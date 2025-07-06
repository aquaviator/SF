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
export function OverrideClockModal({ entry, onClose, onSaved }: OverrideClockModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Format date for input type="date"
  const formatDate = (timestamp: string | Date | null): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  };
  // Format time for input type="time" - convert UTC to local time
  const formatTime = (timestamp: string | Date | null): string => {
    // Convert to local time format for time input
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  // Get default values from actualIn/actualOut or fall back to scheduled times
  const getDefaultInDate = () => {
    return formatDate(entry.clockInTime || entry.scheduledStartTime);
  const getDefaultInTime = () => {
    return formatTime(entry.clockInTime || entry.scheduledStartTime);
  const getDefaultOutDate = () => {
    return formatDate(entry.clockOutTime || entry.scheduledEndTime);
  const getDefaultOutTime = () => {
    return formatTime(entry.clockOutTime || entry.scheduledEndTime);
  const [formData, setFormData] = useState({
    inDate: getDefaultInDate(),
    inTime: getDefaultInTime(),
    outDate: getDefaultOutDate(),
    outTime: getDefaultOutTime(),
    reason: "",
    otherNote: ""
  });
  // Editing state for each field
  const [editing, setEditing] = useState({
    inDate: false,
    inTime: false,
    outDate: false,
    outTime: false
  const reasonOptions = [
    "Staff was on time",
    "Late arrival",
    "Early departure", 
    "Forgot to clock out",
    "Other"
  ];
  const isFormValid = () => {
    const hasRequiredFields = formData.inDate && formData.inTime && formData.reason;
    const hasValidReason = formData.reason !== "Other" || (formData.reason === "Other" && formData.otherNote.trim());
    
    // For completed entries, require clock-out. For active entries, clock-out is optional
    const isActiveEntry = entry.status === "clocked_in" || entry.status === "on_break" || entry.status === "late";
    const hasValidClockOut = isActiveEntry || (formData.outDate && formData.outTime);
    // If both clock-in and clock-out are provided, validate that clock-out is after clock-in
    let hasValidTimeOrder = true;
    if (formData.outDate && formData.outTime && formData.inDate && formData.inTime) {
      const clockInDateTime = new Date(`${formData.inDate}T${formData.inTime}:00`);
      const clockOutDateTime = new Date(`${formData.outDate}T${formData.outTime}:00`);
      hasValidTimeOrder = clockOutDateTime > clockInDateTime;
    }
    return hasRequiredFields && hasValidReason && hasValidClockOut && hasValidTimeOrder;
  const handleFieldEdit = (field: keyof typeof editing) => {
    setEditing(prev => ({ ...prev, [field]: true }));
  const handleFieldBlur = (field: keyof typeof editing) => {
    setEditing(prev => ({ ...prev, [field]: false }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      // Check for specific validation errors
      let errorMessage = "Please fill in all required fields";
      
      if (formData.outDate && formData.outTime && formData.inDate && formData.inTime) {
        const clockInDateTime = new Date(`${formData.inDate}T${formData.inTime}:00`);
        const clockOutDateTime = new Date(`${formData.outDate}T${formData.outTime}:00`);
        if (clockOutDateTime <= clockInDateTime) {
          errorMessage = "Clock out time must be after clock in time";
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    // Combine date and time into ISO format
    const inDateTime = `${formData.inDate}T${formData.inTime}:00`;
    const isActiveEntry = entry.status === "clocked_in" || entry.status === "on_break";
    // For active entries, clock-out is optional
    let payload: any = {
      in: inDateTime,
      note: formData.reason === "Other" ? formData.otherNote : formData.reason
    };
    if (!isActiveEntry || (formData.outDate && formData.outTime)) {
      const outDateTime = `${formData.outDate}T${formData.outTime}:00`;
      // Only validate clock-out time if it's provided
      if (new Date(inDateTime) >= new Date(outDateTime)) {
        toast({
          title: "Error", 
          description: "Clock out time must be after clock in time",
          variant: "destructive"
        });
        return;
      payload.out = outDateTime;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/time-entries/${entry.id}/override`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      if (!response.ok) {
        throw new Error("Failed to override time entry");
      const updatedEntry = await response.json();
        title: "Success",
        description: "Time entry has been overridden"
      onSaved(updatedEntry);
      onClose();
    } catch (error) {
      console.error("Override time entry error:", error);
        description: "Failed to override time entry",
    } finally {
      setIsLoading(false);
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
              {editing.inDate ? (
                <Input
                  type="date"
                  value={formData.inDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, inDate: e.target.value }))}
                  onBlur={() => handleFieldBlur('inDate')}
                  autoFocus
                  required
                  className="flex-1"
                />
              ) : (
                <span
                  role="button"
                  onClick={() => handleFieldEdit('inDate')}
                  className="flex-1 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors"
                  aria-label="Click to edit clock in date"
                  title="Click to edit date"
                >
                  {formData.inDate || "Select date"}
                </span>
              )}
              
              {editing.inTime ? (
                  type="time"
                  value={formData.inTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, inTime: e.target.value }))}
                  onBlur={() => handleFieldBlur('inTime')}
                  onClick={() => handleFieldEdit('inTime')}
                  aria-label="Click to edit clock in time"
                  title="Click to edit time"
                  {formData.inTime || "Select time"}
            </div>
          </div>
          {/* Clock Out Date & Time */}
            <Label>
              Clock Out
              {(entry.status === "clocked_in" || entry.status === "on_break" || entry.status === "late") && (
                <span className="text-sm text-muted-foreground ml-2">(optional for active shifts)</span>
            </Label>
              {editing.outDate ? (
                  value={formData.outDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, outDate: e.target.value }))}
                  onBlur={() => handleFieldBlur('outDate')}
                  onClick={() => handleFieldEdit('outDate')}
                  aria-label="Click to edit clock out date"
                  {formData.outDate || "Select date"}
              {editing.outTime ? (
                  value={formData.outTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, outTime: e.target.value }))}
                  onBlur={() => handleFieldBlur('outTime')}
                  onClick={() => handleFieldEdit('outTime')}
                  aria-label="Click to edit clock out time"
                  {formData.outTime || "Select time"}
          {/* Reason Selector */}
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
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !isFormValid()}>
              {isLoading ? "Saving..." : "Save"}
        </form>
      </DialogContent>
    </Dialog>
  );
