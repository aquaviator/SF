import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, Search, Filter, Users, Plus, Eye } from "lucide-react";
import { StrikeHistoryModal } from "@/components/StrikeHistoryModal";
import { staffApi } from "@/lib/staffApi";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface StaffStrikesSummary {
  userId: number;
  userFirstName: string;
  userLastName: string;
  totalPoints: number;
  activeStrikes: number;
  lastIssued: string | null;
}

export default function OwnerStrikesPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [strikesSummary, setStrikesSummary] = useState<StaffStrikesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pointsFilter, setPointsFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  console.log("🚀 StrikeDashboardPage init", { 
    mode: "owner", 
    userId: user?.id, 
    timestamp: new Date() 
  });

  const fetchStaffAndStrikes = async () => {
    if (!user?.tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("📡 Fetching staff and strikes", { 
        tenantId: user.tenantId,
        timestamp: new Date() 
      });
      
      // Fetch staff list
      const staffResponse = await apiRequest(`/api/staff?tenantId=${user.tenantId}`);
      setStaff(staffResponse);
      
      // Fetch strikes summary for each staff member
      const strikesData: StaffStrikesSummary[] = [];
      
      for (const staffMember of staffResponse) {
        try {
          const strikeData = await staffApi.getStrikes(staffMember.id, user.tenantId);
          const activeStrikes = strikeData.strikes.filter(s => s.isActive);
          const lastStrike = strikeData.strikes
            .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0];
          
          strikesData.push({
            userId: staffMember.id,
            userFirstName: staffMember.firstName,
            userLastName: staffMember.lastName,
            totalPoints: strikeData.totalPoints,
            activeStrikes: activeStrikes.length,
            lastIssued: lastStrike ? lastStrike.issuedAt : null,
          });
        } catch (err) {
          console.warn(`Failed to fetch strikes for user ${staffMember.id}:`, err);
          // Continue with empty data for this user
          strikesData.push({
            userId: staffMember.id,
            userFirstName: staffMember.firstName,
            userLastName: staffMember.lastName,
            totalPoints: 0,
            activeStrikes: 0,
            lastIssued: null,
          });
        }
      }
      
      setStrikesSummary(strikesData);
      
      console.log("✅ Staff strikes data loaded", { 
        staffCount: staffResponse.length,
        strikesCount: strikesData.reduce((sum, s) => sum + s.activeStrikes, 0),
        timestamp: new Date() 
      });
    } catch (err) {
      console.error("❌ Failed to load staff strikes:", err);
      setError("Failed to load staff strike information. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load staff strike information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndStrikes();
  }, [user?.tenantId]);

  const handleViewStrikeHistory = (userId: number) => {
    setSelectedUserId(userId);
    setShowHistoryModal(true);
    console.log("ℹ️ Opening StrikeHistoryModal", { 
      userId, 
      mode: "owner",
      timestamp: new Date() 
    });
  };

  const handleCloseModal = () => {
    setShowHistoryModal(false);
    setSelectedUserId(null);
    console.log("ℹ️ Closing StrikeHistoryModal", { 
      mode: "owner",
      timestamp: new Date() 
    });
  };

  const handleStrikeUpdated = () => {
    // Refresh the strikes data when a strike is updated
    fetchStaffAndStrikes();
    console.log("🔄 Refreshing strikes data after update", { timestamp: new Date() });
  };

  const getStrikeStatusColor = (points: number) => {
    if (points === 0) return "bg-green-500";
    if (points <= 2) return "bg-yellow-500";
    if (points <= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStrikeStatusText = (points: number) => {
    if (points === 0) return "Good Standing";
    if (points <= 2) return "Watch";
    if (points <= 4) return "Warning";
    return "Critical";
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Filter strikes based on search and filters
  const filteredStrikes = strikesSummary.filter(strike => {
    const fullName = `${strike.userFirstName} ${strike.userLastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    
    const matchesPoints = pointsFilter === "all" || 
      (pointsFilter === "0" && strike.totalPoints === 0) ||
      (pointsFilter === "1-2" && strike.totalPoints >= 1 && strike.totalPoints <= 2) ||
      (pointsFilter === "3-4" && strike.totalPoints >= 3 && strike.totalPoints <= 4) ||
      (pointsFilter === "5+" && strike.totalPoints >= 5);
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && strike.activeStrikes > 0) ||
      (statusFilter === "none" && strike.activeStrikes === 0);
    
    return matchesSearch && matchesPoints && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Strike Management</h1>
          <p className="text-muted-foreground">Manage staff strikes and disciplinary actions</p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchStaffAndStrikes} className="min-h-[44px]">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Strike Management</h1>
        <p className="text-muted-foreground">Manage staff strikes and disciplinary actions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Strikes</p>
                <p className="text-2xl font-bold">
                  {strikesSummary.reduce((sum, s) => sum + s.activeStrikes, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical (5+ points)</p>
                <p className="text-2xl font-bold">
                  {strikesSummary.filter(s => s.totalPoints >= 5).length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>
            
            <Select value={pointsFilter} onValueChange={setPointsFilter}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Filter by points" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Points</SelectItem>
                <SelectItem value="0">0 Points</SelectItem>
                <SelectItem value="1-2">1-2 Points</SelectItem>
                <SelectItem value="3-4">3-4 Points</SelectItem>
                <SelectItem value="5+">5+ Points</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Has Active Strikes</SelectItem>
                <SelectItem value="none">No Active Strikes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || pointsFilter !== "all" || statusFilter !== "all") && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredStrikes.length} of {strikesSummary.length} staff members
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Strikes Table/Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Staff Strike Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStrikes.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Staff Found</h3>
              <p className="text-muted-foreground">
                {strikesSummary.length === 0 
                  ? "No staff members to display."
                  : "No staff members match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg font-semibold text-sm">
                  <div>Staff Name</div>
                  <div>Total Points</div>
                  <div>Active Strikes</div>
                  <div>Last Issued</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                <div className="space-y-2 mt-4">
                  {filteredStrikes.map((strike) => (
                    <div 
                      key={strike.userId}
                      className="grid grid-cols-6 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors items-center"
                    >
                      <div className="font-medium">
                        {strike.userFirstName} {strike.userLastName}
                      </div>
                      <div className="font-semibold">
                        {strike.totalPoints}
                      </div>
                      <div>
                        {strike.activeStrikes}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {strike.lastIssued ? formatDate(strike.lastIssued) : "Never"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-3 h-3 rounded-full ${getStrikeStatusColor(strike.totalPoints)}`}
                          ></div>
                          <span className="text-sm">
                            {getStrikeStatusText(strike.totalPoints)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewStrikeHistory(strike.userId)}
                          className="min-h-[36px]"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredStrikes.map((strike) => (
                  <Card key={strike.userId}>
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">
                            {strike.userFirstName} {strike.userLastName}
                          </h3>
                          <Badge 
                            variant={strike.totalPoints >= 5 ? "destructive" : 
                                   strike.totalPoints >= 3 ? "default" : 
                                   strike.totalPoints > 0 ? "secondary" : "outline"}
                          >
                            {strike.totalPoints} {strike.totalPoints === 1 ? 'point' : 'points'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Active Strikes:</span>
                            <div className="font-medium">{strike.activeStrikes}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Issued:</span>
                            <div className="font-medium">
                              {strike.lastIssued ? formatDate(strike.lastIssued) : "Never"}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${getStrikeStatusColor(strike.totalPoints)}`}
                            ></div>
                            <span className="text-sm text-muted-foreground">
                              {getStrikeStatusText(strike.totalPoints)}
                            </span>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewStrikeHistory(strike.userId)}
                            className="min-h-[44px]"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View & Manage
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
        isOpen={showHistoryModal}
        onClose={handleCloseModal}
        userId={selectedUserId || undefined}
        tenantId={user?.tenantId}
        mode="owner"
        onStrikeUpdated={handleStrikeUpdated}
      />
    </div>
  );
}