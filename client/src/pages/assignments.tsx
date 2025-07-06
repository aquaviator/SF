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
import type { Assignment } from "@shared/schema";

const assignmentFormSchema = z.object({
  shiftId: z.string().min(1, "Shift is required"),
  assignedTo: z.string().min(1, "Assignee is required"),
  status: z.literal("pending"),
  notes: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

export default function Assignments() {
  const { tenantId, user } = useAuth();
  
  const {
    data: assignments,
    isLoading,
    isModalOpen,
    editingItem,
    isSubmitting,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
  } = useCrud<Assignment>({
    queryKey: ["/api/assignments", tenantId],
    endpoint: `/api/assignments?tenantId=${tenantId}`,
  });

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      shiftId: "",
      assignedTo: "",
      status: "pending",
      notes: "",
    },
  });

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isModalOpen) {
      if (editingItem) {
        form.reset({
          shiftId: editingItem.shiftId.toString(),
          assignedTo: editingItem.assignedTo.toString(),
          status: "pending",
          notes: editingItem.notes || "",
        });
      } else {
        form.reset({
          shiftId: "",
          assignedTo: "",
          status: "pending",
          notes: "",
        });
      }
    }
  }, [isModalOpen, editingItem, form]);

  const onSubmit = (data: AssignmentFormData) => {
    const submitData = {
      tenantId,
      shiftId: parseInt(data.shiftId),
      assignedTo: parseInt(data.assignedTo),
      assignedBy: parseInt(user?.id || "1"),
      status: "pending",
      notes: data.notes || null,
    };

    if (editingItem) {
      handleSubmit({ ...editingItem, ...submitData });
    } else {
      // For new items, we add a placeholder assignedAt that will be overridden by the server
      handleSubmit({ ...submitData, assignedAt: new Date() });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const columns: Column<Assignment>[] = [
    {
      key: "shiftId",
      header: "Shift",
      cell: (assignment) => (
        <div className="text-sm text-gray-900">
          Shift #{assignment.shiftId}
        </div>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      cell: (assignment) => (
        <div className="text-sm text-gray-900">
          User #{assignment.assignedTo}
        </div>
      ),
    },
    {
      key: "assignedBy",
      header: "Assigned By",
      cell: (assignment) => (
        <div className="text-sm text-gray-600">
          User #{assignment.assignedBy}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (assignment) => getStatusBadge(assignment.status),
    },
    {
      key: "assignedAt",
      header: "Assigned At",
      cell: (assignment) => (
        <div className="text-sm text-gray-600">
          {new Date(assignment.assignedAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      cell: (assignment) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {assignment.notes || "No notes"}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift Assignments</h2>
        <p className="text-gray-600">Manage shift assignments and track acceptance status</p>
      </div>

      <DataTable
        data={assignments}
        columns={columns}
        title="Assignments"
        onAdd={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        addLabel="Create Assignment"
        isLoading={isLoading}
        emptyState={
          <div className="text-center py-8">
            <p className="text-gray-500">No assignments</p>
            <p className="text-sm text-gray-400">Create assignments to manage shift coverage</p>
          </div>
        }
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Assignment" : "Create Assignment"}
        form={form}
        onSubmit={onSubmit}
        submitLabel={editingItem ? "Update Assignment" : "Create Assignment"}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="shiftId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shift" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Customer Service - Dec 16, 9:00 AM</SelectItem>
                    <SelectItem value="2">Security - Dec 16, 5:00 PM</SelectItem>
                    <SelectItem value="3">Cleaning - Dec 17, 6:00 AM</SelectItem>
                    <SelectItem value="4">Maintenance - Dec 17, 2:00 PM</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign To</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Sarah Anderson</SelectItem>
                    <SelectItem value="2">Mike Johnson</SelectItem>
                    <SelectItem value="3">Emily Davis</SelectItem>
                    <SelectItem value="4">David Wilson</SelectItem>
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
                  <Textarea placeholder="Assignment notes or special instructions..." {...field} />
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