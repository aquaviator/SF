import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Business Policy Schema - Extended for time tracking and strike management
const businessPolicySchema = z.object({
  minNoticeHours: z.number().min(0, "Must be at least 0 hours").max(168, "Must be less than 168 hours"),
  maxAdvanceBookingDays: z.number().min(1, "Must be at least 1 day").max(365, "Must be less than 365 days"),
  cancellationDeadlineHours: z.number().min(0, "Must be at least 0 hours").max(48, "Must be less than 48 hours"),
  maxStrikePoints: z.number().min(1, "Must be at least 1 point").max(20, "Must be less than 20 points"),
  strikePointsNoShow: z.number().min(0, "Must be at least 0 points").max(10, "Must be less than 10 points"),
  strikePointsLateCancellation: z.number().min(0, "Must be at least 0 points").max(10, "Must be less than 10 points"),
  resetPeriodDays: z.number().min(1, "Must be at least 1 day").max(365, "Must be less than 365 days"),
  lateGracePeriodMinutes: z.number().min(0, "Must be at least 0 minutes").max(60, "Must be less than 60 minutes"),
  clockInBufferMinutes: z.number().min(5, "Must be at least 5 minutes").max(120, "Must be less than 120 minutes"),
  clockOutBufferMinutes: z.number().min(5, "Must be at least 5 minutes").max(240, "Must be less than 240 minutes"),
});

type BusinessPolicyFormData = z.infer<typeof businessPolicySchema>;

interface BusinessPolicy {
  id?: number;
  tenantId: string;
  minNoticeHours: number;
  maxAdvanceBookingDays: number;
  cancellationDeadlineHours: number;
  maxStrikePoints: number;
  strikePointsNoShow: number;
  strikePointsLateCancellation: number;
  resetPeriodDays: number;
  lateGracePeriodMinutes: number;
  clockInBufferMinutes: number;
  clockOutBufferMinutes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function Policies() {
  const { tenantId } = useAuth();
  const { toast } = useToast();

  // Fetch Business Policy
  const { data: policy, isLoading: policyLoading } = useQuery<BusinessPolicy>({
    queryKey: [`/api/shift-policy?tenantId=${tenantId}`],
  });

  // Business Policy Form
  const policyForm = useForm<BusinessPolicyFormData>({
    resolver: zodResolver(businessPolicySchema),
    defaultValues: {
      minNoticeHours: 24,
      maxAdvanceBookingDays: 30,
      cancellationDeadlineHours: 4,
      maxStrikePoints: 5,
      strikePointsNoShow: 2,
      strikePointsLateCancellation: 1,
      resetPeriodDays: 90,
      lateGracePeriodMinutes: 10,
      clockInBufferMinutes: 15,
      clockOutBufferMinutes: 30,
    },
  });

  // Update form when policy data loads
  React.useEffect(() => {
    if (policy && Object.keys(policy).length > 0) {
      const formValues = {
        minNoticeHours: policy.minNoticeHours || 24,
        maxAdvanceBookingDays: policy.maxAdvanceBookingDays || 30,
        cancellationDeadlineHours: policy.cancellationDeadlineHours || 4,
        maxStrikePoints: policy.maxStrikePoints || 5,
        strikePointsNoShow: policy.strikePointsNoShow || 2,
        strikePointsLateCancellation: policy.strikePointsLateCancellation || 1,
        resetPeriodDays: policy.resetPeriodDays || 90,
        lateGracePeriodMinutes: policy.lateGracePeriodMinutes || 10,
        clockInBufferMinutes: policy.clockInBufferMinutes || 15,
        clockOutBufferMinutes: policy.clockOutBufferMinutes || 30,
      };
      policyForm.reset(formValues);
    } else if (!policyLoading) {
      // Use defaults if no policy exists yet
      const defaultValues = {
        minNoticeHours: 24,
        maxAdvanceBookingDays: 30,
        cancellationDeadlineHours: 4,
        maxStrikePoints: 5,
        strikePointsNoShow: 2,
        strikePointsLateCancellation: 1,
        resetPeriodDays: 90,
        lateGracePeriodMinutes: 10,
        clockInBufferMinutes: 15,
        clockOutBufferMinutes: 30,
      };
      policyForm.reset(defaultValues);
    }
  }, [policy, policyLoading, policyForm]);

  // Policy Update Mutation
  const policyUpdateMutation = useMutation({
    mutationFn: async (data: BusinessPolicyFormData) => {
      const response = await apiRequest("PUT", `/api/shift-policy`, { ...data, tenantId });
      return await response.json();
    },
    onSuccess: (updatedPolicy) => {
      // Update the form with the latest values from the server
      policyForm.reset({
        minNoticeHours: updatedPolicy.minNoticeHours,
        maxAdvanceBookingDays: updatedPolicy.maxAdvanceBookingDays,
        cancellationDeadlineHours: updatedPolicy.cancellationDeadlineHours,
        maxStrikePoints: updatedPolicy.maxStrikePoints,
        strikePointsNoShow: updatedPolicy.strikePointsNoShow,
        strikePointsLateCancellation: updatedPolicy.strikePointsLateCancellation,
        resetPeriodDays: updatedPolicy.resetPeriodDays,
        lateGracePeriodMinutes: updatedPolicy.lateGracePeriodMinutes,
        clockInBufferMinutes: updatedPolicy.clockInBufferMinutes,
        clockOutBufferMinutes: updatedPolicy.clockOutBufferMinutes,
      });
      
      // Invalidate and refetch the query
      queryClient.invalidateQueries({ queryKey: [`/api/shift-policy?tenantId=${tenantId}`] });
      toast({ title: "Business policy updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update policy", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: BusinessPolicyFormData) => {
    policyUpdateMutation.mutate(data);
  };

  if (policyLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Business Policies</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading Policy Settings...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Business Policies</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shift Policy Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your business rules for shift management, booking, and staff behavior.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...policyForm}>
            <form onSubmit={policyForm.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={policyForm.control}
                  name="minNoticeHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Notice (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="168"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Minimum hours notice required to claim or cancel shifts
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={policyForm.control}
                  name="maxAdvanceBookingDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Advance Booking (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Maximum days in advance staff can book shifts
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={policyForm.control}
                  name="cancellationDeadlineHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cancellation Deadline (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="48"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Hours before shift when cancellation is no longer allowed
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={policyForm.control}
                  name="maxStrikePoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Strike Points</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Maximum strike points before staff action is taken
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={policyForm.control}
                  name="strikePointsNoShow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strike Points - No Show</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Points given when staff don't show up for a shift
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={policyForm.control}
                  name="strikePointsLateCancellation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strike Points - Late Cancellation</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Points given for cancelling within the deadline period
                      </p>
                    </FormItem>
                  )}
                />

                <div className="col-span-full">
                  <div className="border-b pb-2 mb-4">
                    <h3 className="text-lg font-semibold">Time Tracking Policies</h3>
                    <p className="text-sm text-muted-foreground">Configure attendance and time tracking rules</p>
                  </div>
                </div>

                <FormField
                  control={policyForm.control}
                  name="resetPeriodDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strike Reset Period (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 90)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Days after which strike points are automatically reset
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={policyForm.control}
                  name="lateGracePeriodMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Late Grace Period (Minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="60"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Minutes after shift start before considered late
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={policyForm.control}
                  name="clockInBufferMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clock-In Buffer (Minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="5"
                          max="120"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Minutes before shift start when clock-in is allowed
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={policyForm.control}
                  name="clockOutBufferMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clock-Out Buffer (Minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="5"
                          max="240"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Minutes after shift end when clock-out is allowed
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={policyUpdateMutation.isPending}
                  className="min-w-[120px]"
                >
                  {policyUpdateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Policy
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}