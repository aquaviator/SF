import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { StrikeHistoryModal } from "@/components/StrikeHistoryModal";
import { staffApi } from "@/lib/staffApi";
import { Loader2 } from "lucide-react";

interface Strike {
  id: number;
  points: number;
  reason: string;
  issuedAt: string;
  expiresAt: string;
  isActive: boolean;
  shiftId?: number;
  notes?: string;
}

interface StrikeData {
  totalPoints: number;
  strikes: Strike[];
}

export default function StaffStrikesPage() {
  const { user } = useAuth();
  const [strikeData, setStrikeData] = useState<StrikeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStrike, setSelectedStrike] = useState<Strike | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log("LOAD_MY_STRIKES", { userId: user?.id, timestamp: new Date() });

  useEffect(() => {
    const fetchStrikes = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await staffApi.getStrikes(user.id, user.tenantId);
        setStrikeData(data);
        
        console.log("STAFF_STRIKES_LOADED", { 
          userId: user.id,
          totalPoints: data.totalPoints,
          strikeCount: data.strikes.length,
          timestamp: new Date()
        });
      } catch (err) {
        console.error("STAFF_STRIKES_ERROR", { error: err, timestamp: new Date() });
        setError("Failed to load strike data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStrikes();
  }, [user?.id]);

  const handleViewHistory = (strike: Strike) => {
    console.log("OPEN_STRIKE_HISTORY", { strikeId: strike.id, timestamp: new Date() });
    setSelectedStrike(strike);
    setIsModalOpen(true);
  };

  const handleRequestReview = (strikeId: number) => {
    console.log("REQUEST_REVIEW_CLICK", { strikeId, timestamp: new Date() });
    // TODO: Implement review request functionality
    alert("Review request functionality will be implemented in future sprint");
  };

  const getStatusColor = (totalPoints: number) => {
    if (totalPoints === 0) return "bg-green-100 text-green-800 border-green-200";
    if (totalPoints <= 2) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (totalPoints <= 4) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getStatusIcon = (totalPoints: number) => {
    if (totalPoints === 0) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (totalPoints <= 2) return <Clock className="h-5 w-5 text-yellow-600" />;
    if (totalPoints <= 4) return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusText = (totalPoints: number) => {
    if (totalPoints === 0) return "Good Standing";
    if (totalPoints <= 2) return "Caution";
    if (totalPoints <= 4) return "Warning";
    return "Action Required";
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

  if (!strikeData) {
    return (
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-600">
              <p>No strike data available</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Your Strike History</h1>
      </div>

      {/* Strike Summary Card */}
      <Card className={`border-2 ${getStatusColor(strikeData.totalPoints)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Current Status</CardTitle>
            {getStatusIcon(strikeData.totalPoints)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {strikeData.totalPoints}
                <span className="text-lg font-normal text-gray-600 ml-2">/ 5 points</span>
              </span>
              <Badge variant="outline" className={getStatusColor(strikeData.totalPoints)}>
                {getStatusText(strikeData.totalPoints)}
              </Badge>
            </div>
            
            {strikeData.totalPoints >= 5 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Action Blocked</p>
                    <p className="text-sm text-red-700">You cannot claim shifts or request swaps until strikes expire.</p>
                  </div>
                </div>
              </div>
            )}
            
            {strikeData.totalPoints >= 3 && strikeData.totalPoints < 5 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Approaching Limit</p>
                    <p className="text-sm text-yellow-700">Be careful - you're close to the maximum strike points.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strike History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strike History</CardTitle>
        </CardHeader>
        <CardContent>
          {strikeData.strikes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">No strikes recorded</p>
              <p className="text-sm">Keep up the good work!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Date</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Shift</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Reason</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Points</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strikeData.strikes.map((strike) => (
                        <tr key={strike.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3 text-sm">
                            {new Date(strike.issuedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-sm">
                            {strike.shiftId ? `#${strike.shiftId}` : "-"}
                          </td>
                          <td className="py-3 px-3 text-sm">{strike.reason}</td>
                          <td className="py-3 px-3 text-sm">
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              {strike.points} pt{strike.points !== 1 ? 's' : ''}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-sm">
                            <Badge variant={strike.isActive ? "destructive" : "secondary"}>
                              {strike.isActive ? "Active" : "Expired"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-sm">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewHistory(strike)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {strike.isActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRequestReview(strike.id)}
                                >
                                  Request Review
                                </Button>
                              )}
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
                {strikeData.strikes.map((strike) => (
                  <Card key={strike.id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {new Date(strike.issuedAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {strike.shiftId ? `Shift #${strike.shiftId}` : "General"}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              {strike.points} pt{strike.points !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant={strike.isActive ? "destructive" : "secondary"}>
                              {strike.isActive ? "Active" : "Expired"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Reason:</p>
                          <p className="text-sm text-gray-600">{strike.reason}</p>
                        </div>

                        {strike.notes && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Notes:</p>
                            <p className="text-sm text-gray-600">{strike.notes}</p>
                          </div>
                        )}

                        <div className="flex space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(strike)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          {strike.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRequestReview(strike.id)}
                              className="flex-1"
                            >
                              Request Review
                            </Button>
                          )}
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
        strike={selectedStrike}
        userRole="staff"
      />
    </div>
  );
}