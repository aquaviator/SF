import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Users, Clock, Shield, Search, Eye, Edit, Plus } from "lucide-react";
import { StrikeHistoryModal } from "@/components/StrikeHistoryModal";
import { staffApi } from "@/lib/staffApi";
import { Loader2 } from "lucide-react";

interface StaffStrikeSummary {
  userId: number;
  userFirstName: string;
  userLastName: string;
  totalPoints: number;
  activeStrikes: number;
  lastIssued: string | null;
}

interface StrikesOverview {
  strikes: StaffStrikeSummary[];
}

export default function OwnerStrikesPage() {
  const { user } = useAuth();
  const [strikesData, setStrikesData] = useState<StrikesOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"view" | "add" | "adjust">("view");
  const [searchTerm, setSearchTerm] = useState("");

  console.log("LOAD_ALL_STRIKES", { tenantId: user?.tenantId, timestamp: new Date() });

  useEffect(() => {
    const fetchAllStrikes = async () => {
      if (!user?.tenantId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await staffApi.getAllStaffStrikes(user.tenantId);
        setStrikesData(data);
        
        console.log("OWNER_STRIKES_LOADED", { 
          tenantId: user.tenantId,
          staffCount: data.strikes.length,
          totalActiveStrikes: data.strikes.reduce((sum, s) => sum + s.activeStrikes, 0),
          timestamp: new Date()
        });
      } catch (err) {
        console.error("OWNER_STRIKES_ERROR", { error: err, timestamp: new Date() });
        setError("Failed to load strikes data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStrikes();
  }, [user?.tenantId]);

  const handleViewHistory = (userId: number) => {
    console.log("OPEN_STAFF_STRIKE_HISTORY", { userId, timestamp: new Date() });
    setSelectedUserId(userId);
    setModalAction("view");
    setIsModalOpen(true);
  };

  const handleManualStrike = (userId: number) => {
    console.log("MANUAL_STRIKE_ASSIGN", { userId, timestamp: new Date() });
    setSelectedUserId(userId);
    setModalAction("add");
    setIsModalOpen(true);
  };

  const handleAdjustStrike = (userId: number) => {
    console.log("STRIKE_ADJUST", { userId, timestamp: new Date() });
    setSelectedUserId(userId);
    setModalAction("adjust");
    setIsModalOpen(true);
  };

  const filteredStaff = strikesData?.strikes.filter(staff => 
    `${staff.userFirstName} ${staff.userLastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalActiveStrikes = strikesData?.strikes.reduce((sum, s) => sum + s.activeStrikes, 0) || 0;
  const atRiskStaff = strikesData?.strikes.filter(s => s.totalPoints >= 4).length || 0;
  const recentNoShows = strikesData?.strikes.filter(s => {
    if (!s.lastIssued) return false;
    const lastIssued = new Date(s.lastIssued);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return lastIssued >= yesterday;
  }).length || 0;

  const getPointsColor = (points: number) => {
    if (points === 0) return "text-green-600";
    if (points <= 2) return "text-yellow-600";
    if (points <= 4) return "text-orange-600";
    return "text-red-600";
  };

  const getPointsBadgeColor = (points: number) => {
    if (points === 0) return "bg-green-100 text-green-800";
    if (points <= 2) return "bg-yellow-100 text-yellow-800";
    if (points <= 4) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Error Loading Strikes</p>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Compliance & Strikes</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-blue-800">Total Active Strikes</CardTitle>
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalActiveStrikes}</div>
            <p className="text-sm text-gray-600">Across all staff</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-orange-800">At Risk Staff</CardTitle>
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{atRiskStaff}</div>
            <p className="text-sm text-gray-600">≥4 strike points</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-red-800">Recent No-Shows</CardTitle>
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{recentNoShows}</div>
            <p className="text-sm text-gray-600">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Staff Strike Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredStaff.length} of {strikesData?.strikes.length || 0} staff
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">No staff found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Staff Member</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Total Points</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Active Strikes</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Last Strike</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((staff) => (
                        <tr 
                          key={staff.userId} 
                          className={`border-b hover:bg-gray-50 ${staff.totalPoints >= 5 ? 'bg-red-50' : ''}`}
                        >
                          <td className="py-3 px-3 text-sm">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                {staff.userFirstName.charAt(0)}{staff.userLastName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{staff.userFirstName} {staff.userLastName}</p>
                                {staff.totalPoints >= 5 && (
                                  <p className="text-xs text-red-600">⛔ Actions Blocked</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-sm">
                            <Badge className={getPointsBadgeColor(staff.totalPoints)}>
                              {staff.totalPoints} / 5 pts
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-sm">
                            <span className={`font-medium ${getPointsColor(staff.totalPoints)}`}>
                              {staff.activeStrikes}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sm">
                            {staff.lastIssued ? (
                              <div>
                                <p>{new Date(staff.lastIssued).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(staff.lastIssued).toLocaleTimeString()}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400">Never</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-sm">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewHistory(staff.userId)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManualStrike(staff.userId)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Strike
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAdjustStrike(staff.userId)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Adjust
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredStaff.map((staff) => (
                  <Card 
                    key={staff.userId} 
                    className={`border ${staff.totalPoints >= 5 ? 'border-red-300 bg-red-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                              {staff.userFirstName.charAt(0)}{staff.userLastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{staff.userFirstName} {staff.userLastName}</p>
                              {staff.totalPoints >= 5 && (
                                <p className="text-xs text-red-600">⛔ Actions Blocked</p>
                              )}
                            </div>
                          </div>
                          <Badge className={getPointsBadgeColor(staff.totalPoints)}>
                            {staff.totalPoints} / 5
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700">Active Strikes:</p>
                            <p className={`font-medium ${getPointsColor(staff.totalPoints)}`}>
                              {staff.activeStrikes}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Last Strike:</p>
                            <p className="text-gray-600">
                              {staff.lastIssued ? new Date(staff.lastIssued).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(staff.userId)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualStrike(staff.userId)}
                            className="flex-1"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjustStrike(staff.userId)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Adjust
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strike History Modal */}
      <StrikeHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={selectedUserId}
        tenantId={user?.tenantId}
        mode="owner"
        initialAction={modalAction}
        onStrikeUpdated={() => {
          // Refresh the strikes data when a strike is updated
          const fetchAllStrikes = async () => {
            if (!user?.tenantId) return;
            try {
              const data = await staffApi.getAllStaffStrikes(user.tenantId);
              setStrikesData(data);
            } catch (error) {
              console.error("Failed to refresh strikes data:", error);
            }
          };
          fetchAllStrikes();
        }}
      />
    </div>
  );
}