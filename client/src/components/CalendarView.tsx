import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Shift } from "@shared/schema";

interface CalendarViewProps {
  shifts: Shift[];
  onCreateShift: (date: string) => void;
  onEditShift: (shift: Shift) => void;
  onDuplicateShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: number) => void;
  userRole: "owner" | "staff";
}

export function CalendarView({ 
  shifts, 
  onCreateShift, 
  onEditShift, 
  onDuplicateShift, 
  onDeleteShift,
  userRole 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);

  // Generate calendar days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getShiftsForDate = (day: number) => {
    const dateStr = formatDate(day);
    return shifts.filter(shift => shift.date === dateStr);
  };

  const handleDayClick = (day: number) => {
    const dateStr = formatDate(day);
    setSelectedDate(dateStr);
    setDayModalOpen(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_acceptance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'conflict': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const selectedDateShifts = selectedDate ? shifts.filter(shift => shift.date === selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-medium text-gray-500 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-24" />;
              }

              const dayShifts = getShiftsForDate(day);
              const today = new Date();
              const isToday = year === today.getFullYear() && 
                            month === today.getMonth() && 
                            day === today.getDate();

              return (
                <div
                  key={day}
                  className={`h-24 p-2 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayShifts.slice(0, 2).map(shift => (
                      <div
                        key={shift.id}
                        className={`text-xs px-2 py-1 rounded text-center truncate ${getStatusColor(shift.status)}`}
                      >
                        {shift.role}
                      </div>
                    ))}
                    {dayShifts.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayShifts.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Modal */}
      <Dialog open={dayModalOpen} onOpenChange={setDayModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Shifts for {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {userRole === 'owner' && (
              <Button 
                onClick={() => {
                  if (selectedDate) {
                    onCreateShift(selectedDate);
                    setDayModalOpen(false);
                  }
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Shift
              </Button>
            )}

            {selectedDateShifts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No shifts scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateShifts.map(shift => (
                  <Card key={shift.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{shift.role}</h4>
                            <Badge className={getStatusColor(shift.status)}>
                              {shift.status.replace('_', ' ')}
                            </Badge>
                            {shift.assignmentType === 'opportunity' && (
                              <Badge variant="outline">Open Opportunity</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{shift.startTime} - {shift.endTime}</p>
                            <p>{shift.location}</p>
                            <p>{shift.description}</p>
                            {shift.requiredStaff > 1 && (
                              <p>Required staff: {shift.requiredStaff}</p>
                            )}
                          </div>
                        </div>

                        {userRole === 'owner' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                onEditShift(shift);
                                setDayModalOpen(false);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                onDuplicateShift(shift);
                                setDayModalOpen(false);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                onDeleteShift(shift.id);
                                setDayModalOpen(false);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        {userRole === 'staff' && shift.assignmentType === 'opportunity' && shift.status === 'open' && (
                          <Button size="sm">
                            Claim Shift
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}