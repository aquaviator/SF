import React, { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Edit3, 
  Trash2, 
  Copy,
  Plus,
  AlertCircle
} from "lucide-react";
import { Shift } from "@shared/schema";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface CalendarDayModalProps {
  date: Date | null;
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (id: string | number) => void;
  onDuplicateShift: (shift: Shift) => void;
  onCreateShift: (date: Date) => void;
  isDeleting?: boolean;
}
export function CalendarDayModal({
  date,
  isOpen,
  onClose,
  shifts,
  onEditShift,
  onDeleteShift,
  onDuplicateShift,
  onCreateShift,
  isDeleting = false,
}: CalendarDayModalProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  if (!date) return null;
  const dayShifts = shifts.filter(shift => 
    format(new Date(shift.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );
  const handleDeleteClick = (shift: Shift) => {
    setShiftToDelete(shift);
    setDeleteDialogOpen(true);
  };
  const handleConfirmDelete = () => {
    if (shiftToDelete) {
      onDeleteShift(shiftToDelete.id);
      setDeleteDialogOpen(false);
      setShiftToDelete(null);
    }
  const getStatusBadge = (status: string) => {
    const variants = {
      "assigned": "bg-blue-100 text-blue-800",
      "open": "bg-green-100 text-green-800", 
      "pending_acceptance": "bg-yellow-100 text-yellow-800",
      "confirmed": "bg-green-100 text-green-800",
      "declined": "bg-red-100 text-red-800",
      "conflict": "bg-red-100 text-red-800",
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Shifts for {format(date, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Create New Shift Button */}
            <Button 
              onClick={() => onCreateShift(date)}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Shift for This Day
            </Button>
            {/* Shifts List */}
            {dayShifts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No shifts scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayShifts.map((shift) => (
                  <Card key={shift.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{shift.description || 'Untitled Shift'}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {shift.startTime} - {shift.endTime}
                            </div>
                            {shift.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {shift.location}
                              </div>
                            )}
                            {shift.role && (
                                <User className="w-3 h-3" />
                                {shift.role}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(shift.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditShift(shift)}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        
                          onClick={() => onDuplicateShift(shift)}
                          <Copy className="w-3 h-3 mr-1" />
                          Duplicate
                          onClick={() => handleDeleteClick(shift)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                      {shift.assignmentType === 'assigned' && shift.assignedTo && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-700">
                            <User className="w-3 h-3 inline mr-1" />
                            Assigned to staff member
                          </p>
                      )}
                      {shift.assignmentType === 'opportunity' && (
                        <div className="mt-2 p-2 bg-green-50 rounded-md">
                          <p className="text-sm text-green-700">
                            Open opportunity - available for staff to claim
                    </CardContent>
                  </Card>
                ))}
            )}
          </div>
        </DialogContent>
      </Dialog>
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Shift"
        description={`Are you sure you want to delete this shift? This action cannot be undone.`}
      />
    </>
