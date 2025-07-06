import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCrud } from "@/hooks/useCrud";
import { DataTable, Column } from "@/components/DataTable";
import { ModalForm } from "@/components/ModalForm";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import type { SwapRequest } from "@shared/schema";

const swapRequestFormSchema = z.object({
  originalShiftId: z.string().min(1, "Original shift is required"),
  targetShiftId: z.string().optional(),
  reason: z.string().optional(),
});

type SwapRequestFormData = z.infer<typeof swapRequestFormSchema>;

export default function SwapRequests() {
  const { tenantId, user } = useAuth();
  
  const {
    data: swapRequests = [],
    isLoading,
    isModalOpen,
    editingItem,
    closeModal,
    openEditModal,
    handleDelete,
    handleSubmit,
  } = useCrud<SwapRequest>({
    queryKey: ["swapRequests", tenantId],
    endpoint: `/api/swap-requests?tenantId=${tenantId}`,
  });

  const form = useForm<SwapRequestFormData>({
    resolver: zodResolver(swapRequestFormSchema),
    defaultValues: {
      originalShiftId: "",
      targetShiftId: "",
      reason: "",
    },
  });

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isModalOpen) {
      if (editingItem) {
        form.reset({
          originalShiftId: editingItem.originalShiftId.toString(),
          targetShiftId: editingItem.targetShiftId?.toString() || "",
          reason: editingItem.reason || "",
        });
      } else {
        form.reset({
          originalShiftId: "",
          targetShiftId: "",
          reason: "",
        });
      }
    }
  }, [isModalOpen, editingItem, form]);

  const onSubmit = (data: SwapRequestFormData) => {
    const submitData = {
      tenantId,
      requesterId: parseInt(user?.id || "1"),
      originalShiftId: parseInt(data.originalShiftId),
      targetShiftId: data.targetShiftId ? parseInt(data.targetShiftId) : null,
      status: "pending" as const,
      reason: data.reason || null,
    };

    if (editingItem) {
      handleSubmit({ ...submitData, id: editingItem.id } as SwapRequest);
    } else {
      handleSubmit(submitData);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const columns: Column<SwapRequest>[] = [
    {
      key: "originalShiftId",
      header: "Original Shift",
      cell: (swapRequest) => `Shift #${swapRequest.originalShiftId}`,
    },
    {
      key: "targetShiftId",
      header: "Target Shift", 
      cell: (swapRequest) => swapRequest.targetShiftId ? `Shift #${swapRequest.targetShiftId}` : "Any available",
    },
    {
      key: "reason",
      header: "Reason",
      cell: (swapRequest) => swapRequest.reason || "No reason provided",
    },
    {
      key: "status",
      header: "Status",
      cell: (swapRequest) => getStatusBadge(swapRequest.status),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Swap Requests</h1>
        <p className="text-muted-foreground">
          Request to swap your shifts with colleagues
        </p>
      </div>

      <DataTable
        data={swapRequests}
        columns={columns}
        title="Swap Requests"
        onEdit={openEditModal}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Swap Request" : "Create Swap Request"}
        form={form}
        onSubmit={onSubmit}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="originalShiftId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Shift</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select original shift" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Morning Shift - 8:00 AM</SelectItem>
                    <SelectItem value="2">Afternoon Shift - 2:00 PM</SelectItem>
                    <SelectItem value="3">Evening Shift - 6:00 PM</SelectItem>
                    <SelectItem value="4">Night Shift - 10:00 PM</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetShiftId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Shift (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target shift or leave empty for any" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Any available shift</SelectItem>
                    <SelectItem value="1">Morning Shift - 8:00 AM</SelectItem>
                    <SelectItem value="2">Afternoon Shift - 2:00 PM</SelectItem>
                    <SelectItem value="3">Evening Shift - 6:00 PM</SelectItem>
                    <SelectItem value="4">Night Shift - 10:00 PM</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Explain why you need to swap this shift..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </ModalForm>
    </div>
  );
}