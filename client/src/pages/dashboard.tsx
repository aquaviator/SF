import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const { role } = useAuth();

  const ownerStats = [
    { title: "This Week", value: "24", icon: Calendar, color: "bg-blue-100 text-blue-600" },
    { title: "Assigned", value: "18", icon: Users, color: "bg-green-100 text-green-600" },
    { title: "Pending", value: "6", icon: Clock, color: "bg-yellow-100 text-yellow-600" },
    { title: "Conflicts", value: "2", icon: AlertTriangle, color: "bg-red-100 text-red-600" },
  ];

  const staffStats = [
    { title: "My Shifts", value: "8", icon: Calendar, color: "bg-blue-100 text-blue-600" },
    { title: "This Week", value: "3", icon: Clock, color: "bg-green-100 text-green-600" },
    { title: "Available", value: "12", icon: Users, color: "bg-yellow-100 text-yellow-600" },
    { title: "Requests", value: "1", icon: AlertTriangle, color: "bg-red-100 text-red-600" },
  ];

  const stats = role === "owner" ? ownerStats : staffStats;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {role === "owner" ? "Management Dashboard" : "My Dashboard"}
        </h2>
        <p className="text-gray-600">
          {role === "owner" 
            ? "Overview of your team's shift management" 
            : "Your shift schedule and opportunities"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Shift assigned to Sarah Anderson</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">New shift opportunity posted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Swap request pending approval</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Customer Service</p>
                  <p className="text-xs text-gray-500">Tomorrow 9:00 AM</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Sarah A.</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Security</p>
                  <p className="text-xs text-gray-500">Tomorrow 5:00 PM</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-red-500">Unassigned</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Cleaning</p>
                  <p className="text-xs text-gray-500">Wed 6:00 AM</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Mike J.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
