import React from "react";
import { useRole } from "@/hooks/useRole";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCrud } from "@/hooks/useCrud";
import { DataTable, Column } from "@/components/DataTable";
import { ModalForm } from "@/components/ModalForm";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Shift } from "@shared/schema";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

const shiftFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  role: z.string().min(1, "Role is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});
type ShiftFormData = z.infer<typeof shiftFormSchema>;
export default function Shifts() {
  const { tenantId } = useRole();
  
  const {
    data: shifts,
    isLoading,
    isModalOpen,
    editingItem,
    isSubmitting,
    deleteDialogOpen,
    itemToDelete,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    confirmDelete,
    cancelDelete,
  } = useCrud<Shift>({
    queryKey: ["/api/shifts", tenantId],
    endpoint: `/api/shifts?tenantId=${tenantId}`,
  });
  const form = useForm<ShiftFormData>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      role: "",
      description: "",
      location: "",
      assignedTo: "unassigned",
      notes: "",
    },
  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isModalOpen) {
      if (editingItem) {
        form.reset({
          date: editingItem.date,
          startTime: editingItem.startTime,
          endTime: editingItem.endTime,
          role: editingItem.role,
          assignedTo: editingItem.assignedTo?.toString() || "",
          notes: editingItem.notes || "",
        });
      } else {
          date: "",
          startTime: "",
          endTime: "",
          role: "",
          assignedTo: "unassigned",
          notes: "",
      }
    }
  }, [isModalOpen, editingItem, form]);
  const onSubmit = (data: ShiftFormData) => {
    const submitData = {
      ...data,
      tenantId,
      assignedTo: data.assignedTo && data.assignedTo !== "unassigned" ? parseInt(data.assignedTo) : null,
      status: (data.assignedTo && data.assignedTo !== "unassigned" ? "assigned" : "open") as "open" | "assigned" | "confirmed" | "conflict",
      createdBy: 1, // Stubbed user ID
      notes: data.notes || null,
    };
    if (editingItem) {
      handleSubmit({ ...submitData, id: editingItem.id } as Shift);
    } else {
      handleSubmit(submitData);
  };
  const getStatusBadge = (status: string) => {
    const variants = {
      open: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      conflict: "bg-red-100 text-red-800",
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  const columns: Column<Shift>[] = [
    {
      key: "date",
      header: "Date & Time",
      cell: (shift) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {new Date(shift.date).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500">
            {shift.startTime} - {shift.endTime}
        </div>
      ),
      key: "role",
      header: "Role",
      key: "assignedTo",
      header: "Assigned To",
        <div className="text-sm text-gray-900">
          {shift.assignedTo ? `Staff Member ${shift.assignedTo}` : "Unassigned"}
      key: "status",
      header: "Status",
      cell: (shift) => getStatusBadge(shift.status),
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift Management</h2>
        <p className="text-gray-600">Manage and assign shifts for your team</p>
      </div>
      <DataTable
        data={shifts}
        columns={columns}
        title="Upcoming Shifts"
        onAdd={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        addLabel="Add Shift"
        isLoading={isLoading}
        emptyState={
          <div className="text-center py-8">
            <p className="text-gray-500">No shifts scheduled</p>
            <p className="text-sm text-gray-400">Create your first shift to get started</p>
        }
      />
      <ModalForm
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Shift" : "Add New Shift"}
        form={form}
        onSubmit={onSubmit}
        submitLabel={editingItem ? "Update Shift" : "Create Shift"}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              name="endTime"
                  <FormLabel>End Time</FormLabel>
            name="role"
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer Service">Customer Service</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Cleaning">Cleaning</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
            name="description"
                <FormLabel>Description</FormLabel>
                  <Input placeholder="Brief description of shift duties" {...field} />
            name="location"
                <FormLabel>Location</FormLabel>
                  <Input placeholder="Shift location" {...field} />
            name="assignedTo"
                <FormLabel>Assign To</FormLabel>
                      <SelectValue placeholder="Leave unassigned" />
                    <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                    <SelectItem value="1">Sarah Anderson</SelectItem>
                    <SelectItem value="2">Mike Johnson</SelectItem>
                    <SelectItem value="3">Emily Davis</SelectItem>
                    <SelectItem value="4">David Wilson</SelectItem>
            name="notes"
                <FormLabel>Notes</FormLabel>
                  <Textarea placeholder="Optional notes..." {...field} />
      </ModalForm>
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Shift"
        itemName={itemToDelete ? `shift for ${itemToDelete.date}` : "this shift"}
    </div>
  );
}
