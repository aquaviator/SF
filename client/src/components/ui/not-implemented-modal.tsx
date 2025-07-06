import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface NotImplementedModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
}
export function NotImplementedModal({
  isOpen,
  onClose,
  feature,
  description
}: NotImplementedModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Feature Not Yet Implemented</DialogTitle>
          </div>
          <DialogDescription>
            <strong>{feature}</strong> is not yet implemented.
            {description && (
              <span className="block mt-2 text-sm text-gray-600">
                {description}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
