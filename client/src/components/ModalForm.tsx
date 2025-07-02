import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface ModalFormProps<T extends FieldValues = FieldValues> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  children: React.ReactNode;
  submitLabel?: string;
  isLoading?: boolean;
}

export function ModalForm<T extends FieldValues = FieldValues>({
  isOpen,
  onClose,
  title,
  form,
  onSubmit,
  children,
  submitLabel = "Save",
  isLoading = false,
}: ModalFormProps<T>) {
  const handleSubmit = (data: T) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Fill out the form below to save your changes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {children}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
