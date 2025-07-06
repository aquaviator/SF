import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCrud } from "@/hooks/useCrud";
import { DataTable, Column } from "@/components/DataTable";
import { ModalForm } from "@/components/ModalForm";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/useRole";
import type { User } from "@shared/schema";

const staffFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.literal("staff"),
  isActive: z.boolean(),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

export default function Staff() {
  const { tenantId } = useRole();
  
  // Early return if no tenantId
  if (!tenantId) {
    return <div>Loading...</div>;
  }
  
  const {
    data: staff,
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
  } = useCrud<User>({
    queryKey: ["/api/staff", tenantId],
    endpoint: `/api/staff?tenantId=${tenantId}`,
  });

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "staff",
      isActive: true,
    },
  });

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isModalOpen) {
      if (editingItem) {
        form.reset({
          username: editingItem.username,
          firstName: editingItem.firstName,
          lastName: editingItem.lastName,
          email: editingItem.email,
          password: "", // Don't pre-fill password for editing
          role: "staff",
          isActive: editingItem.isActive,
        });
      } else {
        form.reset({
          username: "",
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "staff",
          isActive: true,
        });
      }
    }
  }, [isModalOpen, editingItem, form]);

  const onSubmit = (data: StaffFormData) => {
    // Complete user schema with all required fields
    const submitData = {
      tenantId: tenantId!, // Safe after early return check
      username: data.username,
      role: data.role as "staff",
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      isActive: data.isActive,
      // Required schema fields with defaults (matching schema.ts exactly)
      phone: null,
      address: null,
      bio: null,
      dateOfBirth: null,
      hireDate: null,
      employeeId: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      photoUrl: null,
      activationToken: null,
      tokenExpiresAt: null,
    };

    if (editingItem) {
      handleSubmit({ ...submitData, id: editingItem.id } as User);
    } else {
      handleSubmit(submitData);
    }
  };

  const columns: Column<User>[] = [
    {
      key: "firstName",
      header: "Name",
      cell: (user) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-xs font-medium">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-500">@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
    },
    {
      key: "isActive",
      header: "Status",
      cell: (user) => (
        <Badge variant={user.isActive ? "default" : "secondary"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff Management</h2>
        <p className="text-gray-600">Manage your team members and their access</p>
      </div>

      <DataTable
        data={staff}
        columns={columns}
        title="Team Members"
        onAdd={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        addLabel="Add Staff Member"
        isLoading={isLoading}
        emptyState={
          <div className="text-center py-8">
            <p className="text-gray-500">No staff members added</p>
            <p className="text-sm text-gray-400">Add your first team member to get started</p>
          </div>
        }
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Staff Member" : "Add New Staff Member"}
        form={form}
        onSubmit={onSubmit}
        submitLabel={editingItem ? "Update Staff" : "Add Staff"}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </ModalForm>
    </div>
  );
}
