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
    console.log("🔧 MODAL_FORM_SUBMIT", { data, formErrors: form.formState.errors });
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>
            Fill out the form below to save your changes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="form-grid grid gap-4 md:grid-cols-2">
              {children}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="min-h-[44px]">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="min-h-[44px]"
                onClick={() => console.log("🔧 SUBMIT_BUTTON_CLICKED", { 
                  isLoading, 
                  formValid: form.formState.isValid,
                  formErrors: form.formState.errors,
                  formValues: form.getValues()
                })}
              >
                {isLoading ? "Saving..." : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
