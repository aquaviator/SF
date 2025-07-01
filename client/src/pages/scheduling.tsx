import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/DataTable";
import { useCrud } from "@/hooks/useCrud";
import { 
  Calendar,
  Clock,
  Users,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Plus,
  Copy
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Shift } from "@shared/schema";

interface ShiftTemplate {
  id: number;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  department: string;
  requiredStaff: number;
  isActive: boolean;
}

interface LiveOperation {
  id: number;
  staffName: string;
  shiftName: string;
  status: "clocked-in" | "clocked-out" | "break" | "absent";
  clockInTime?: string;
  breakTime?: string;
  location: string;
}

export default function Scheduling() {
  const { tenantId } = useAuth();

  // Shift Planner
  const {
    data: shifts = [],
    isLoading: shiftsLoading,
    isModalOpen: shiftModalOpen,
    editingItem: editingShift,
    isSubmitting: shiftSubmitting,
    openCreateModal: openCreateShift,
    openEditModal: openEditShift,
    closeModal: closeShiftModal,
    handleSubmit: handleShiftSubmit,
    handleDelete: handleShiftDelete,
  } = useCrud<Shift>({
    queryKey: ["/api/shifts", tenantId],
    endpoint: `/api/shifts?tenantId=${tenantId}`,
  });

  // Shift Templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<ShiftTemplate[]>({
    queryKey: ["/api/shift-templates", tenantId],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: 1,
          name: "Morning Customer Service",
          description: "Handle customer inquiries and support",
          startTime: "09:00",
          endTime: "17:00",
          department: "Customer Service",
          requiredStaff: 3,
          isActive: true,
        },
        {
          id: 2,
          name: "Evening Security",
          description: "Building security and monitoring",
          startTime: "18:00",
          endTime: "06:00",
          department: "Security",
          requiredStaff: 2,
          isActive: true,
        },
        {
          id: 3,
          name: "Weekend Maintenance",
          description: "Equipment maintenance and repairs",
          startTime: "08:00",
          endTime: "16:00",
          department: "Maintenance",
          requiredStaff: 1,
          isActive: false,
        },
      ];
    },
  });

  // Live Operations
  const { data: liveOps = [], isLoading: liveOpsLoading } = useQuery<LiveOperation[]>({
    queryKey: ["/api/live-operations", tenantId],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: 1,
          staffName: "Sarah Anderson",
          shiftName: "Customer Service",
          status: "clocked-in",
          clockInTime: "09:15",
          location: "Front Desk",
        },
        {
          id: 2,
          staffName: "Mike Johnson",
          shiftName: "Security",
          status: "break",
          clockInTime: "18:00",
          breakTime: "21:30",
          location: "Main Gate",
        },
        {
          id: 3,
          staffName: "Emily Davis",
          shiftName: "Reception",
          status: "clocked-in",
          clockInTime: "08:45",
          location: "Lobby",
        },
        {
          id: 4,
          staffName: "David Wilson",
          shiftName: "Maintenance",
          status: "absent",
          location: "Workshop",
        },
      ];
    },
  });

  const getStatusBadge = (status: LiveOperation["status"]) => {
    const variants = {
      "clocked-in": "bg-green-100 text-green-800",
      "clocked-out": "bg-gray-100 text-gray-800",
      "break": "bg-yellow-100 text-yellow-800",
      "absent": "bg-red-100 text-red-800",
    };

    const labels = {
      "clocked-in": "Clocked In",
      "clocked-out": "Clocked Out",
      "break": "On Break", 
      "absent": "Absent",
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getStatusIcon = (status: LiveOperation["status"]) => {
    switch (status) {
      case "clocked-in":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "break":
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case "absent":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const shiftColumns: Column<Shift>[] = [
    {
      key: "description",
      header: "Shift Details",
      cell: (shift) => (
        <div>
          <p className="font-medium text-sm">{shift.description}</p>
          <p className="text-xs text-gray-500">{shift.location}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date & Time",
      cell: (shift) => (
        <div>
          <p className="text-sm">{new Date(shift.date).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">{shift.startTime} - {shift.endTime}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (shift) => (
        <Badge variant={shift.status === "published" ? "default" : "secondary"}>
          {shift.status}
        </Badge>
      ),
    },
  ];

  const templateColumns: Column<ShiftTemplate>[] = [
    {
      key: "name",
      header: "Template",
      cell: (template) => (
        <div>
          <p className="font-medium text-sm">{template.name}</p>
          <p className="text-xs text-gray-500">{template.description}</p>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      cell: (template) => (
        <Badge variant="outline">{template.department}</Badge>
      ),
    },
    {
      key: "schedule",
      header: "Schedule",
      cell: (template) => (
        <div className="text-sm">
          <p>{template.startTime} - {template.endTime}</p>
          <p className="text-xs text-gray-500">{template.requiredStaff} staff required</p>
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (template) => (
        <Badge variant={template.isActive ? "default" : "secondary"}>
          {template.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (template) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Copy className="w-3 h-3 mr-1" />
            Use
          </Button>
          <Button size="sm" variant="ghost">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Scheduling</h2>
          <p className="text-gray-600">Manage shifts, templates, and live operations</p>
        </div>
        <Button onClick={openCreateShift}>
          <Plus className="w-4 h-4 mr-2" />
          Create Shift
        </Button>
      </div>

      <Tabs defaultValue="planner" className="space-y-6">
        <TabsList>
          <TabsTrigger value="planner" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Shift Planner
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Live Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="space-y-6">
          <DataTable
            data={shifts}
            columns={shiftColumns}
            title="Scheduled Shifts"
            onAdd={openCreateShift}
            onEdit={openEditShift}
            onDelete={handleShiftDelete}
            addLabel="Create Shift"
            isLoading={shiftsLoading}
            emptyState={
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No shifts scheduled</p>
                <p className="text-sm text-gray-400">Create your first shift to get started</p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <DataTable
            data={templates}
            columns={templateColumns}
            title="Shift Templates"
            addLabel="Create Template"
            isLoading={templatesLoading}
            emptyState={
              <div className="text-center py-8">
                <Copy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No templates created</p>
                <p className="text-sm text-gray-400">Create reusable shift templates</p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clocked In</p>
                    <p className="text-2xl font-bold text-green-600">
                      {liveOps.filter(op => op.status === "clocked-in").length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">On Break</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {liveOps.filter(op => op.status === "break").length}
                    </p>
                  </div>
                  <Pause className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {liveOps.filter(op => op.status === "absent").length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Staff</p>
                    <p className="text-2xl font-bold text-blue-600">{liveOps.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="w-5 h-5 mr-2" />
                Live Staff Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveOps.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(operation.status)}
                      <div>
                        <p className="font-medium text-sm">{operation.staffName}</p>
                        <p className="text-xs text-gray-500">{operation.shiftName} • {operation.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {operation.clockInTime && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Clocked in</p>
                          <p className="text-sm font-medium">{operation.clockInTime}</p>
                        </div>
                      )}
                      {operation.breakTime && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Break started</p>
                          <p className="text-sm font-medium">{operation.breakTime}</p>
                        </div>
                      )}
                      {getStatusBadge(operation.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}