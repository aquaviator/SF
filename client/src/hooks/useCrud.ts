import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UseCrudOptions<T> {
  queryKey: string[];
  endpoint: string;
  onSuccess?: (action: "create" | "update" | "delete", data?: T) => void;
  onError?: (action: "create" | "update" | "delete", error: Error) => void;
}

export function useCrud<T extends { id: string | number }>({
  queryKey,
  endpoint,
  onSuccess,
  onError,
}: UseCrudOptions<T>) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch data
  const { data, isLoading, error } = useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      const response = await apiRequest("GET", endpoint);
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newItem: Omit<T, "id">) => {
      const response = await apiRequest("POST", endpoint, newItem);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      setIsModalOpen(false);
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      onSuccess?.("create", data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create item",
        variant: "destructive",
      });
      onError?.("create", error);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedItem: T) => {
      const response = await apiRequest("PUT", `${endpoint}/${updatedItem.id}`, updatedItem);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      setIsModalOpen(false);
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      onSuccess?.("update", data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
      onError?.("update", error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      await apiRequest("DELETE", `${endpoint}/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      onSuccess?.("delete");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
      onError?.("delete", error);
    },
  });

  // Helper functions
  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: T) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (formData: Omit<T, "id"> | T) => {
    if (editingItem) {
      updateMutation.mutate(formData as T);
    } else {
      createMutation.mutate(formData as Omit<T, "id">);
    }
  };

  // Replace browser confirm with custom modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const handleDelete = (item: T) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return {
    // Data
    data: data || [],
    isLoading,
    error,

    // Modal state
    isModalOpen,
    editingItem,
    isSubmitting: createMutation.isPending || updateMutation.isPending,

    // Delete dialog state
    deleteDialogOpen,
    itemToDelete,

    // Actions
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    confirmDelete,
    cancelDelete,

    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
