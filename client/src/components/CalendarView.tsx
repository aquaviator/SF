import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Shift } from "@shared/schema";
import { useRoleColors } from "@/hooks/useRoleColors";
import { DayShiftsModal } from "./DayShiftsModal";

interface CalendarViewProps {
  shifts: Shift[];
  onDateClick?: (date: Date) => void;
  onCreateShift: (date: Date) => void;
  onEditShift: (shift: Shift) => void;
  onDuplicateShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: number) => void;

  userRole: "owner" | "staff";
}

export function CalendarView({ 
  shifts, 
  onDateClick,
  onCreateShift, 
  onEditShift, 
  onDuplicateShift, 
  onDeleteShift,
  userRole 
}: CalendarViewProps) {
  const { getRoleColorByTitle, getRoleDotColorByTitle, getRoleLabelByTitle, getRoleInitialByTitle } = useRoleColors();
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
    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    if (onDateClick) {
      onDateClick(dateObj);
    } else {
      setSelectedDate(dateStr);
      setDayModalOpen(true);
    }
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
      case 'claimed': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'clocked_in': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'clocked_out': return 'bg-lime-100 text-lime-800 border-lime-200';
      case 'completed': return 'bg-green-200 text-green-900 border-green-300';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };



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
                return <div key={`empty-${index}`} className="h-24" />;
              }

              const dayShifts = getShiftsForDate(day);
              const today = new Date();
              const isToday = year === today.getFullYear() && 
                            month === today.getMonth() && 
                            day === today.getDate();

              return (
                <div
                  key={`day-${year}-${month}-${day}`}
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
                        className="flex items-center justify-center"
                      >
                        {/* Desktop: badge with role initial */}
                        <span
                          className={`hidden md:inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-medium ${getRoleColorByTitle(shift.role)}`}
                          title={`${getRoleLabelByTitle(shift.role)}`}
                        >
                          {getRoleInitialByTitle(shift.role)}
                        </span>

                        {/* Mobile: colored dot only */}
                        <span
                          className={`inline-block md:hidden w-3 h-3 rounded-full ${getRoleDotColorByTitle(shift.role)}`}
                          title={`${getRoleLabelByTitle(shift.role)}`}
                        />
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


      {/* Day Shifts Modal */}
      <DayShiftsModal 
        date={selectedDate}
        isOpen={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        onCreateShift={onCreateShift}
        onEditShift={onEditShift}
        onDuplicateShift={onDuplicateShift}
        userRole={userRole}
      />
    </div>
  );
}