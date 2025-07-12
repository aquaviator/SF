import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast"; // ✅ Correct


import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import {
  Plus,
  Clock,
  Briefcase,
  CheckCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

// --- Schemas for holiday & swap forms (unchanged) ---
const holidayRequestFormSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
  type: z
    .enum([
      "vacation",
      "sick",
      "personal",
      "emergency",
      "bereavement",
      "maternity",
      "paternity",
      "study",
      "other",
    ])
    .default("vacation"),
  priority: z
    .enum(["low", "normal", "high", "urgent"])
    .default("normal"),
});
type HolidayRequestFormData = z.infer<typeof holidayRequestFormSchema>;

const swapRequestFormSchema = z.object({
  originalShiftId: z.string().min(1, "Please select your shift"),
  targetShiftId: z.string().min(1, "Please select shift to swap with"),
  reason: z.string().min(1, "Please provide a reason for the swap"),
});
type SwapRequestFormData = z.infer<typeof swapRequestFormSchema>;

// --- Main component ---
export default function MyWork() {
  const { role, tenantId, user } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "my-shifts" | "holiday-requests" | "swap-requests" | "time-tracking" | "my-strikes">("overview");
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  // --- Form hooks ---
  const holidayForm = useForm<HolidayRequestFormData>({
    resolver: zodResolver(holidayRequestFormSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
      type: "vacation",
      priority: "normal",
    },
  });
  const swapForm = useForm<SwapRequestFormData>({
    resolver: zodResolver(swapRequestFormSchema),
    defaultValues: {
      originalShiftId: "",
      targetShiftId: "",
      reason: "",
    },
  });

  // --- Data fetching ---
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["my-shifts", tenantId, user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/my-shifts?tenantId=${tenantId}&userId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch shifts");
      return res.json();
    },
  });

  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery({
    queryKey: ["opportunities", tenantId, user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/opportunities?tenantId=${tenantId}&userId=${user?.id}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Filter out any opportunities whose start time is already past
  const filteredOpportunities = useMemo(() => {
    const now = new Date();
    return opportunities.filter((opp: any) => {
      const start = new Date(`${opp.date}T${opp.startTime}`);
      return start >= now;
    });
  }, [opportunities]);

  // --- Render ---
  return (
    <div className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="my-shifts">My Shifts</TabsTrigger>
          <TabsTrigger value="holiday-requests">Holiday</TabsTrigger>
          <TabsTrigger value="swap-requests">Swaps</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          {/* ... your existing overview cards ... */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Available Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {opportunitiesLoading ? (
                <div className="flex items-center"><Loader2 className="animate-spin" /><span className="ml-2">Loading…</span></div>
              ) : filteredOpportunities.length > 0 ? (
                <ul className="space-y-2">
                  {filteredOpportunities.map((opp: any) => (
                    <li key={opp.id} className="p-3 border rounded hover:shadow">
                      <div className="flex justify-between">
                        <div>
                          <strong>{opp.role}</strong> — {opp.date} @ {opp.startTime}
                        </div>
                        <Button size="sm" onClick={() => {/* claim logic */}}>
                          Claim
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming opportunities</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Shifts */}
        <TabsContent value="my-shifts">
          {shiftsLoading ? (
            <div className="flex items-center"><Loader2 className="animate-spin" /><span className="ml-2">Loading…</span></div>
          ) : shifts.length > 0 ? (
            <ul className="space-y-2">
              {shifts.map((shift: any) => (
                <li key={shift.id} className="p-3 border rounded">
                  {shift.date} — {shift.startTime} to {shift.endTime} ({shift.role})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">You have no scheduled shifts.</p>
          )}
        </TabsContent>

        {/* Holiday Requests */}
        <TabsContent value="holiday-requests">
          {/* ... your holiday request UI ... */}
        </TabsContent>

        {/* Swap Requests */}
        <TabsContent value="swap-requests">
          {/* ... your swap request UI ... */}
        </TabsContent>
      </Tabs>

      {/* Holiday Request Modal */}
      <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
        <DialogTrigger asChild>
          <Button>New Holiday Request</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
            <DialogDescription>Submit your holiday or sick leave request.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={holidayForm.handleSubmit((data) => {
              // ... mutation logic ...
            })}
            className="space-y-4"
          >
            {/* ... form fields ... */}
            <Button type="submit">Submit</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Swap Request Modal */}
      <Dialog open={isSwapModalOpen} onOpenChange={setIsSwapModalOpen}>
        <DialogTrigger asChild>
          <Button>Request Swap</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Shift Swap</DialogTitle>
            <DialogDescription>Choose shifts to swap.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={swapForm.handleSubmit((data) => {
              // ... mutation logic ...
            })}
            className="space-y-4"
          >
            {/* ... form fields ... */}
            <Button type="submit">Submit Swap</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
