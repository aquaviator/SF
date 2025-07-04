import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, X, Loader2, AlertTriangle, Clock, Calendar as CalendarLucide, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { staffApi, type CreateStrikeRequest } from "@/lib/staffApi";
import { toast } from "@/hooks/use-toast";
import type { StaffStrike } from "@shared/schema";

interface StrikeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  tenantId?: string;
  mode: "staff" | "owner";
  selectedStrike?: StaffStrike | null;
  onStrikeUpdated?: () => void;
  initialAction?: "view" | "add" | "adjust";
}

const addStrikeSchema = z.object({
  reason: z.enum(["no_show", "late_cancellation", "manual_adjustment"]),
  points: z.number().min(1).max(5),
  shiftId: z.number().optional(),
  notes: z.string().optional(),
  expiresAt: z.date().optional(),
});

type AddStrikeForm = z.infer<typeof addStrikeSchema>;

export function StrikeHistoryModal({
  isOpen,
  onClose,
  userId,
  tenantId,
  mode,
  selectedStrike,
  onStrikeUpdated,
  initialAction = "view"
}: StrikeHistoryModalProps) {
  const [strikes, setStrikes] = useState<StaffStrike[]>([]);
  const [userShifts, setUserShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (initialAction === "add") return "add-strike";
    if (initialAction === "adjust") return "adjust-strike";
    return "history";
  });

  const form = useForm<AddStrikeForm>({
    resolver: zodResolver(addStrikeSchema),
    defaultValues: {
      reason: "manual_adjustment",
      points: 1,
      notes: "",
    },
  });

  console.log("🎭 StrikeHistoryModal", { 
    isOpen, 
    userId, 
    mode, 
    selectedStrike: selectedStrike?.id,
    timestamp: new Date() 
  });

  const fetchStrikeHistory = async () => {
    if (!userId || !tenantId) return;

    setLoading(true);
    try {
      console.log("📡 Fetching strike history", { userId, tenantId, timestamp: new Date() });
      
      const data = await staffApi.getStrikes(userId, tenantId);
      setStrikes(data.strikes);
      
      console.log("✅ Strike history loaded", { 
        userId,
        strikeCount: data.strikes.length,
        timestamp: new Date() 
      });
    } catch (error) {
      console.error("❌ Failed to load strike history:", error);
      toast({
        title: "Error",
        description: "Failed to load strike history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserShifts = async () => {
    if (!userId || !tenantId) return;

    try {
      console.log("📡 Fetching user shifts", { userId, tenantId, timestamp: new Date() });
      
      // Fetch shifts for this user from the last 30 days
      const response = await fetch(`/api/shifts?tenantId=${tenantId}&assignedTo=${userId}&limit=20`);
      const shifts = await response.json();
      
      // Sort by date (most recent first) and filter out future shifts
      const recentShifts = shifts
        .filter((shift: any) => new Date(shift.date) <= new Date())
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); // Show last 10 shifts
      
      setUserShifts(recentShifts);
      
      console.log("✅ User shifts loaded", { 
        userId,
        shiftCount: recentShifts.length,
        timestamp: new Date() 
      });
    } catch (error) {
      console.error("❌ Failed to load user shifts:", error);
      setUserShifts([]);
    }
  };

  useEffect(() => {
    if (isOpen && userId && tenantId) {
      fetchStrikeHistory();
      fetchUserShifts();
    }
  }, [isOpen, userId, tenantId]);

  const handleCloseModal = () => {
    onClose();
    setActiveTab("history");
    form.reset();
    console.log("ℹ️ Closing StrikeHistoryModal", { userId, timestamp: new Date() });
  };

  const handleAddStrike = async (data: AddStrikeForm) => {
    if (!userId || !tenantId) return;

    setSubmitting(true);
    try {
      console.log("✏️ Adding strike", { 
        userId,
        formData: data,
        timestamp: new Date() 
      });

      const request: CreateStrikeRequest = {
        tenantId,
        userId,
        reason: data.reason,
        points: data.points,
        shiftId: data.shiftId,
        notes: data.notes,
        expiresAt: data.expiresAt?.toISOString(),
      };

      await staffApi.createStrike(request);
      
      // Refresh strike history
      await fetchStrikeHistory();
      
      // Reset form and switch to history tab
      form.reset();
      setActiveTab("history");
      
      // Notify parent component
      onStrikeUpdated?.();
      
      toast({
        title: "Strike Added",
        description: "The strike has been successfully added.",
      });

      console.log("✅ Strike added successfully", { userId, timestamp: new Date() });
    } catch (error) {
      console.error("❌ Failed to add strike:", error);
      toast({
        title: "Error",
        description: "Failed to add strike. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateStrike = async (strikeId: number) => {
    if (!userId) return;

    try {
      console.log("🗑️ Deactivating strike", { userId, strikeId, timestamp: new Date() });
      
      await staffApi.deactivateStrike(userId, strikeId);
      
      // Refresh strike history
      await fetchStrikeHistory();
      
      // Notify parent component
      onStrikeUpdated?.();
      
      toast({
        title: "Strike Deactivated",
        description: "The strike has been deactivated.",
      });

      console.log("✅ Strike deactivated successfully", { userId, strikeId, timestamp: new Date() });
    } catch (error) {
      console.error("❌ Failed to deactivate strike:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate strike. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "no_show": return "No Show";
      case "late_cancellation": return "Late Cancellation";
      case "manual_adjustment": return "Manual Adjustment";
      default: return reason;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="strike-history-title"
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle id="strike-history-title" className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Strike Management
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCloseModal}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="history" className="min-h-[44px]">
              <FileText className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            {mode === "owner" && (
              <TabsTrigger value="add" className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Add Strike
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : strikes.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Strikes Found</h3>
                <p className="text-muted-foreground">This user has no strike history.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {strikes.map((strike) => (
                  <Card key={strike.id} className={cn(
                    "transition-colors",
                    !strike.isActive && "opacity-60 bg-muted/50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={strike.reason === 'no_show' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {getReasonLabel(strike.reason)}
                            </Badge>
                            <span className="font-semibold">
                              {strike.points} {strike.points === 1 ? 'point' : 'points'}
                            </span>
                            {!strike.isActive && (
                              <Badge variant="outline" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarLucide className="h-3 w-3" />
                              Issued: {formatDate(strike.issuedAt)} at {formatTime(strike.issuedAt)}
                            </div>
                            {strike.expiresAt && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires: {formatDate(strike.expiresAt)}
                              </div>
                            )}
                          </div>
                          
                          {strike.notes && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              {strike.notes}
                            </div>
                          )}
                        </div>
                        
                        {mode === "owner" && strike.isActive && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeactivateStrike(strike.id)}
                            className="min-h-[44px]"
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {mode === "owner" && (
            <TabsContent value="add" className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddStrike)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="min-h-[44px]">
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="no_show">No Show</SelectItem>
                              <SelectItem value="late_cancellation">Late Cancellation</SelectItem>
                              <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              className="min-h-[44px]"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shiftId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Shift (Optional)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="min-h-[44px]">
                              <SelectValue placeholder="Select a recent shift" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No specific shift</SelectItem>
                            {userShifts.map((shift) => (
                              <SelectItem key={shift.id} value={shift.id.toString()}>
                                {format(new Date(shift.date), "MMM d")} - {shift.role} ({shift.startTime} - {shift.endTime})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional details about this strike"
                            className="min-h-[88px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date Override (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full min-h-[44px] justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="min-h-[44px] flex-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding Strike...
                        </>
                      ) : (
                        "Add Strike"
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        form.reset();
                        setActiveTab("history");
                      }}
                      className="min-h-[44px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}