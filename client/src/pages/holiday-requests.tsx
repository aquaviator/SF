import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useCrud } from "@/hooks/useCrud";
import { DataTable, Column } from "@/components/DataTable";
import { ModalForm } from "@/components/ModalForm";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { HolidayRequest } from "@shared/schema";

const holidayRequestFormSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
  type: z.enum(["vacation", "sick", "personal", "emergency", "bereavement", "maternity", "paternity", "study", "other"]).default("vacation"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

type HolidayRequestFormData = z.infer<typeof holidayRequestFormSchema>;

export default function HolidayRequests() {
  const { tenantId, user } = useAuth();
  
  // Memoized query function to fetch holiday requests with user names
  const fetchHolidayRequests = useCallback(async () => {
    const response = await fetch(`/api/holiday-requests?tenantId=${tenantId}`);
    const data = await response.json();
    console.log("STAFF HOLIDAY REQUESTS: holiday requests raw data →", data);
    
    // Process data to include display names
    return data.map((req: any) => {
      const displayName = req.name || (req.firstName && req.lastName 
        ? `${req.firstName} ${req.lastName}` 
        : `User #${req.requesterId}`);
      console.log(`STAFF HOLIDAY REQUESTS: processing request ${req.id} - name field: "${req.name}", computed: "${displayName}"`);
      return {
        ...req,
        displayName, // Add display name for UI
      };
    });
  }, [tenantId]);

  // Custom query for holiday requests with user names
  const { data: holidayRequests = [], isLoading } = useQuery({
    queryKey: ["/api/holiday-requests", tenantId],
    queryFn: fetchHolidayRequests,
    enabled: !!tenantId,
  });

  // Use the remaining crud functionality from useCrud hook
  const {
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
      type: "vacation",
      priority: "normal",
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
          type: editingItem.type || "vacation",
          priority: editingItem.priority || "normal",
        });
      } else {
        form.reset({
          startDate: "",
          endDate: "",
          reason: "",
          type: "vacation",
          priority: "normal",
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

  const columns: Column<any>[] = [
    {
      key: "requesterId",
      header: "Requested By",
      cell: (request) => (
        <div className="text-sm text-gray-900">
          {request.displayName || request.name || `User #${request.requesterId}`}
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
          {request.reviewedBy ? `Manager (User #${request.reviewedBy})` : "Pending"}
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="bereavement">Bereavement</SelectItem>
                    <SelectItem value="maternity">Maternity</SelectItem>
                    <SelectItem value="paternity">Paternity</SelectItem>
                    <SelectItem value="study">Study Leave</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
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
                  <Textarea placeholder="Additional details or specific reason..." {...field} />
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