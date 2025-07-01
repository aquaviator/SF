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
  shiftId: z.string().min(1, "Shift is required"),
  requestedShiftId: z.string().min(1, "Requested shift is required"),
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
      shiftId: "",
      requestedShiftId: "",
      reason: "",
    },
  });

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isModalOpen) {
      if (editingItem) {
        form.reset({
          shiftId: editingItem.shiftId.toString(),
          requestedShiftId: editingItem.requestedShiftId.toString(),
          reason: editingItem.reason || "",
        });
      } else {
        form.reset({
          shiftId: "",
          requestedShiftId: "",
          reason: "",
        });
      }
    }
  }, [isModalOpen, editingItem, form]);

  const onSubmit = (data: SwapRequestFormData) => {
    const submitData = {
      ...data,
      tenantId,
      requesterId: parseInt(user?.id || "1"),
      shiftId: parseInt(data.shiftId),
      requestedShiftId: parseInt(data.requestedShiftId),
      status: "pending" as const,
      reason: data.reason || null,
    };

    if (editingItem) {
      handleSubmit({ ...submitData, id: editingItem.id, createdAt: editingItem.createdAt } as SwapRequest);
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
      key: "shiftId",
      header: "Current Shift",
      cell: (request) => (
        <div className="text-sm text-gray-900">
          Shift #{request.shiftId}
        </div>
      ),
    },
    {
      key: "requestedShiftId", 
      header: "Requested Shift",
      cell: (request) => (
        <div className="text-sm text-gray-900">
          Shift #{request.requestedShiftId}
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
    {
      key: "createdAt",
      header: "Requested",
      cell: (request) => (
        <div className="text-sm text-gray-600">
          {new Date(request.createdAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Swap Requests</h2>
        <p className="text-gray-600">Request to swap shifts with other team members</p>
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
            <p className="text-sm text-gray-400">Create a request to swap shifts with colleagues</p>
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
            name="shiftId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Current Shift</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your shift to swap" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Customer Service - Dec 16, 9:00 AM</SelectItem>
                    <SelectItem value="2">Security - Dec 16, 5:00 PM</SelectItem>
                    <SelectItem value="4">Maintenance - Dec 17, 2:00 PM</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requestedShiftId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift You Want</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select desired shift" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="3">Cleaning - Dec 17, 6:00 AM</SelectItem>
                    <SelectItem value="5">Reception - Dec 18, 8:00 AM</SelectItem>
                    <SelectItem value="6">Night Security - Dec 18, 11:00 PM</SelectItem>
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
                  <Textarea placeholder="Why do you want to swap these shifts?" {...field} />
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