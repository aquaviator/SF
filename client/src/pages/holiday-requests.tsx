import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCrud } from "@/hooks/useCrud";
import { DataTable, Column } from "@/components/DataTable";
import { ModalForm } from "@/components/ModalForm";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import type { HolidayRequest } from "@shared/schema";

const holidayRequestFormSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
});

type HolidayRequestFormData = z.infer<typeof holidayRequestFormSchema>;

export default function HolidayRequests() {
  const { tenantId, user } = useAuth();
  
  const {
    data: holidayRequests,
    isLoading,
    isModalOpen,
    editingItem,
    isSubmitting,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
  } = useCrud<HolidayRequest>({
    queryKey: ["/api/holiday-requests", tenantId],
    endpoint: `/api/holiday-requests?tenantId=${tenantId}`,
  });

  const form = useForm<HolidayRequestFormData>({
    resolver: zodResolver(holidayRequestFormSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isModalOpen) {
      if (editingItem) {
        form.reset({
          startDate: editingItem.startDate,
          endDate: editingItem.endDate,
          reason: editingItem.reason || "",
        });
      } else {
        form.reset({
          startDate: "",
          endDate: "",
          reason: "",
        });
      }
    }
  }, [isModalOpen, editingItem, form]);

  const onSubmit = (data: HolidayRequestFormData) => {
    const submitData = {
      ...data,
      tenantId,
      requesterId: parseInt(user?.id || "1"),
      status: "pending" as const,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      reason: data.reason || null,
    };

    if (editingItem) {
      handleSubmit({ ...submitData, id: editingItem.id, createdAt: editingItem.createdAt } as HolidayRequest);
    } else {
      handleSubmit({ ...submitData, createdAt: new Date() });
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

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return daysDiff;
  };

  const columns: Column<HolidayRequest>[] = [
    {
      key: "requesterId",
      header: "Requested By",
      cell: (request) => (
        <div className="text-sm text-gray-900">
          User #{request.requesterId}
        </div>
      ),
    },
    {
      key: "startDate",
      header: "Dates",
      cell: (request) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500">
            {calculateDays(request.startDate, request.endDate)} days
          </div>
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
    {
      key: "reviewedBy",
      header: "Reviewed By",
      cell: (request) => (
        <div className="text-sm text-gray-600">
          {request.reviewedBy ? `User #${request.reviewedBy}` : "Pending"}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Holiday Requests</h2>
        <p className="text-gray-600">Manage time-off requests and vacation scheduling</p>
      </div>

      <DataTable
        data={holidayRequests}
        columns={columns}
        title="Holiday Requests"
        onAdd={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        addLabel="Request Time Off"
        isLoading={isLoading}
        emptyState={
          <div className="text-center py-8">
            <p className="text-gray-500">No holiday requests</p>
            <p className="text-sm text-gray-400">Submit a request to plan your time off</p>
          </div>
        }
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Holiday Request" : "Request Time Off"}
        form={form}
        onSubmit={onSubmit}
        submitLabel={editingItem ? "Update Request" : "Submit Request"}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
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
                  <Textarea placeholder="Vacation, personal time, family event, etc..." {...field} />
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