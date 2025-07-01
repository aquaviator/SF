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
  status: z.literal("pending"),
});

type SwapRequestFormData = z.infer<typeof swapRequestFormSchema>;

export default function SwapRequests() {
  const { tenantId, user } = useAuth();
  
  const {
    data: swapRequests,
    isLoading,
    isModalOpen,
    editingItem,
    isSubmitting,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
  } = useCrud<SwapRequest>({
    queryKey: ["/api/swap-requests", tenantId],
    endpoint: `/api/swap-requests?tenantId=${tenantId}`,
  });

  const form = useForm<SwapRequestFormData>({
    resolver: zodResolver(swapRequestFormSchema),
    defaultValues: {
      originalShiftId: "",
      targetShiftId: "open",
      reason: "",
      status: "pending",
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
          status: "pending",
        });
      } else {
        form.reset({
          originalShiftId: "",
          targetShiftId: "open",
          reason: "",
          status: "pending",
        });
      }
    }
  }, [isModalOpen, editingItem, form]);

  const onSubmit = (data: SwapRequestFormData) => {
    const submitData = {
      ...data,
      tenantId,
      requesterId: parseInt(user?.id || "1"),
      originalShiftId: parseInt(data.originalShiftId),
      targetShiftId: data.targetShiftId && data.targetShiftId !== "open" ? parseInt(data.targetShiftId) : null,
      reason: data.reason || null,
      status: "pending" as const,
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const columns: Column<SwapRequest>[] = [
    {
      key: "originalShiftId",
      header: "Original Shift",
      cell: (request) => (
        <div className="text-sm text-gray-900">
          Shift #{request.originalShiftId}
        </div>
      ),
    },
    {
      key: "targetShiftId",
      header: "Target Shift",
      cell: (request) => (
        <div className="text-sm text-gray-900">
          {request.targetShiftId ? `Shift #${request.targetShiftId}` : "Open request"}
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (request) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {request.reason || "No reason provided"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (request) => getStatusBadge(request.status),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift Swap Requests</h2>
        <p className="text-gray-600">Manage shift exchange requests with your team</p>
      </div>

      <DataTable
        data={swapRequests}
        columns={columns}
        title="Swap Requests"
        onAdd={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        addLabel="Request Swap"
        isLoading={isLoading}
        emptyState={
          <div className="text-center py-8">
            <p className="text-gray-500">No swap requests</p>
            <p className="text-sm text-gray-400">Create a request to exchange shifts with colleagues</p>
          </div>
        }
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Swap Request" : "Request Shift Swap"}
        form={form}
        onSubmit={onSubmit}
        submitLabel={editingItem ? "Update Request" : "Submit Request"}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="originalShiftId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Shift to Swap</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your shift" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Customer Service - Dec 16, 9:00 AM</SelectItem>
                    <SelectItem value="2">Security - Dec 16, 5:00 PM</SelectItem>
                    <SelectItem value="3">Cleaning - Dec 17, 6:00 AM</SelectItem>
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
                      <SelectValue placeholder="Select target shift or leave open" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="open">Open request (any shift)</SelectItem>
                    <SelectItem value="4">Customer Service - Dec 18, 9:00 AM</SelectItem>
                    <SelectItem value="5">Security - Dec 18, 5:00 PM</SelectItem>
                    <SelectItem value="6">Cleaning - Dec 19, 6:00 AM</SelectItem>
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
                  <Textarea placeholder="Why do you need to swap this shift?" {...field} />
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