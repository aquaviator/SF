import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Copy, Trash2, Clock, MapPin, User } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRoleColors } from "@/hooks/useRoleColors";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Shift } from "@shared/schema";

interface DayShiftsModalProps {
  date: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateShift: (date: Date) => void;
  onEditShift: (shift: Shift) => void;
  onDuplicateShift: (shift: Shift) => void;
  userRole: "owner" | "staff";
}

export function DayShiftsModal({
  date,
  isOpen,
  onClose,
  onCreateShift,
  onEditShift,
  onDuplicateShift,
  userRole
}: DayShiftsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getRoleColorByTitle, getRoleLabelByTitle, getRoleInitialByTitle } = useRoleColors();
  const { tenantId } = useAuth();
  
  const [dayShifts, setDayShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [staff, setStaff] = useState<any[]>([]);

  // Fetch shifts for the selected date
  useEffect(() => {
    if (date && isOpen) {
      console.log('DayShiftsModal opening for date:', date);
      fetchDayShifts();
      fetchStaff();
    }
  }, [date, isOpen, tenantId]);

  const fetchDayShifts = async () => {
    if (!date || !tenantId) {
      console.log('DayShiftsModal: Missing date or tenantId', { date, tenantId });
      return;
    }
    
    console.log('DayShiftsModal: Fetching shifts for date:', date, 'tenant:', tenantId);
    setLoading(true);
    try {
      const response = await apiRequest("GET", `/api/shifts?date=${date}&tenantId=${tenantId}`);
      const shifts = await response.json();
      console.log('DayShiftsModal: Received shifts:', shifts);
      setDayShifts(shifts);
    } catch (error) {
      console.error("DayShiftsModal: Failed to fetch shifts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch shifts for this date",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    if (!tenantId) return;
    
    try {
      const response = await apiRequest("GET", `/api/staff?tenantId=${tenantId}`);
      const staffData = await response.json();
      console.log('DayShiftsModal: Received staff:', staffData);
      setStaff(staffData);
    } catch (error) {
      console.error("DayShiftsModal: Failed to fetch staff:", error);
    }
  };

  const refreshShifts = () => {
    // Refresh the shift data for this date
    fetchDayShifts();
  };

  // Helper function to find staff member by ID
  const getStaffById = (staffId: number | null) => {
    if (!staffId || !Array.isArray(staff)) return null;
    return staff.find(s => s.id === staffId);
  };

  // Helper function to format staff name as "FirstName LastInitial"
  const formatStaffName = (staffMember: any) => {
    if (!staffMember) return null;
    const firstName = staffMember.firstName || staffMember.username?.split('.')[0] || 'Unknown';
    const lastName = staffMember.lastName || staffMember.username?.split('.')[1] || '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return lastInitial ? `${firstName} ${lastInitial}` : firstName;
  };

  // Helper function to format status display
  const getStatusDisplay = (shift: Shift) => {
    const staffMember = getStaffById(shift.assignedTo);
    const staffName = formatStaffName(staffMember);
    
    if (shift.assignedTo && staffName) {
      return staffName;
    }
    
    return 'Open';
  };

  const handleCreateShift = () => {
    if (date) {
      onCreateShift(new Date(date + 'T00:00:00'));
      // Refresh after a short delay to see new shift
      setTimeout(refreshShifts, 500);
    }
  };

  const handleEditShift = (shift: Shift) => {
    onEditShift(shift);
    // Refresh after a short delay to see updated shift
    setTimeout(refreshShifts, 500);
  };

  const handleDuplicateShift = async (shift: Shift) => {
    try {
      // Create a copy of the shift without the ID and reset some fields
      const duplicateShiftData = {
        tenantId: shift.tenantId,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        role: shift.role,
        description: shift.description,
        location: shift.location,
        assignedTo: null, // Reset assignment for copy
        status: "open" as const,
        assignmentType: shift.assignmentType,
        requiredStaff: shift.requiredStaff,
        claimedBy: null,
        templateId: null,
        notes: shift.notes,
        createdBy: shift.createdBy
      };

      // Create the duplicate shift via API
      await apiRequest("POST", `/api/shifts?tenantId=${tenantId}`, duplicateShiftData);
      
      // Refresh the shifts list to show the new copy
      setTimeout(refreshShifts, 500);
      
      toast({
        title: "Shift Duplicated",
        description: "A copy of the shift has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate shift",
        variant: "destructive"
      });
    }
  };

  const openDeleteDialog = (shift: Shift) => {
    setShiftToDelete(shift);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!shiftToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/shifts/${shiftToDelete.id}?tenantId=${tenantId}`);
      
      // Remove from local state
      setDayShifts(prev => prev.filter(s => s.id !== shiftToDelete.id));
      
      // Invalidate queries to update calendar
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      
      toast({
        title: "Shift Deleted",
        description: "The shift has been successfully deleted."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete shift",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setShiftToDelete(null);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="day-modal-description">
          <DialogHeader>
            <DialogTitle>
              Shifts for {date && formatDate(date)}
            </DialogTitle>
          </DialogHeader>
          <div id="day-modal-description" className="sr-only">
            View and manage shifts scheduled for this date
          </div>

          <div className="space-y-4">
            {/* Create Shift Button */}
            {userRole === 'owner' && (
              <Button 
                onClick={handleCreateShift}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Shift
              </Button>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading shifts...</p>
              </div>
            )}

            {/* No Shifts State */}
            {!loading && dayShifts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No shifts scheduled for this date</p>
              </div>
            )}

            {/* Shifts List */}
            {!loading && dayShifts.length > 0 && (
              <div className="space-y-3">
                {dayShifts.map((shift) => (
                  <Card key={shift.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Role Badge */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${getRoleColorByTitle(shift.role)}`}>
                          {getRoleInitialByTitle(shift.role)}
                        </div>
                        
                        {/* Shift Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{getRoleLabelByTitle(shift.role)}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {shift.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{shift.location}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{getStatusDisplay(shift)}</span>
                            </div>
                          </div>
                          
                          {shift.description && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {shift.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      {userRole === 'owner' && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditShift(shift)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateShift(shift)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(shift)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {shiftToDelete?.role} shift on {date && formatDate(date)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}