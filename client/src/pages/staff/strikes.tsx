import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Clock, Calendar, FileText } from "lucide-react";
import { StrikeHistoryModal } from "@/components/StrikeHistoryModal";
import { staffApi } from "@/lib/staffApi";
import { toast } from "@/hooks/use-toast";
import type { StaffStrike } from "@shared/schema";

interface StrikeData {
  totalPoints: number;
  strikes: StaffStrike[];
}

export default function StaffStrikesPage() {
  const { user } = useAuth();
  const [strikeData, setStrikeData] = useState<StrikeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStrike, setSelectedStrike] = useState<StaffStrike | null>(null);

  console.log("🚀 StrikeDashboardPage init", { 
    mode: "staff", 
    userId: user?.id, 
    timestamp: new Date() 
  });

  const fetchStrikes = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("📡 Fetching staff strikes", { 
        userId: user.id, 
        tenantId: user.tenantId,
        timestamp: new Date() 
      });
      
      const data = await staffApi.getStrikes(user.id, user.tenantId);
      setStrikeData(data);
      
      console.log("✅ Strike data loaded", { 
        totalPoints: data.totalPoints,
        strikeCount: data.strikes.length,
        timestamp: new Date() 
      });
    } catch (err) {
      console.error("❌ Failed to load strikes:", err);
      setError("Failed to load your strike information. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load strike information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrikes();
  }, [user?.id]);

  const handleViewDetails = (strike: StaffStrike) => {
    setSelectedStrike(strike);
    setShowHistoryModal(true);
    console.log("ℹ️ Opening StrikeHistoryModal", { 
      userId: user?.id, 
      strikeId: strike.id,
      timestamp: new Date() 
    });
  };

  const handleCloseModal = () => {
    setShowHistoryModal(false);
    setSelectedStrike(null);
    console.log("ℹ️ Closing StrikeHistoryModal", { 
      userId: user?.id,
      timestamp: new Date() 
    });
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

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </CardHeader>
          <CardContent>
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
          <h1 className="text-2xl font-bold mb-2">My Strikes</h1>
          <p className="text-muted-foreground">View your current strike points and history</p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Strikes</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchStrikes} className="min-h-[44px]">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeStrikes = strikeData?.strikes.filter(s => s.isActive) || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Strikes</h1>
        <p className="text-muted-foreground">View your current strike points and history</p>
      </div>

      {/* Strike Points Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Your Strike Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold mb-1">
                {strikeData?.totalPoints || 0}
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${getStrikeStatusColor(strikeData?.totalPoints || 0)}`}
                ></div>
                <span className="text-sm text-muted-foreground">
                  {getStrikeStatusText(strikeData?.totalPoints || 0)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Maximum: 5 points</div>
              <div className="text-sm text-muted-foreground">
                Active strikes: {activeStrikes.length}
              </div>
            </div>
          </div>
          
          {/* Strike points progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>0</span>
              <span>5</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getStrikeStatusColor(strikeData?.totalPoints || 0)}`}
                style={{ width: `${Math.min(((strikeData?.totalPoints || 0) / 5) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Strikes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Active Strikes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeStrikes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No active strikes</div>
              <div className="text-sm text-muted-foreground">Keep up the good work!</div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeStrikes.map((strike) => (
                <div 
                  key={strike.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={strike.reason === 'no_show' ? 'destructive' : 'secondary'}>
                        {strike.reason === 'no_show' ? 'No Show' : 
                         strike.reason === 'late_cancellation' ? 'Late Cancellation' : 
                         'Manual Adjustment'}
                      </Badge>
                      <span className="font-semibold">
                        {strike.points} {strike.points === 1 ? 'point' : 'points'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Issued: {formatDate(strike.issuedAt)} at {formatTime(strike.issuedAt)}
                      </div>
                      {strike.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Expires: {formatDate(strike.expiresAt)}
                        </div>
                      )}
                    </div>
                    
                    {strike.notes && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {strike.notes}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(strike)}
                    className="min-h-[44px] mt-3 sm:mt-0 sm:ml-4"
                  >
                    Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strike History Modal */}
      <StrikeHistoryModal
        isOpen={showHistoryModal}
        onClose={handleCloseModal}
        userId={user?.id}
        tenantId={user?.tenantId}
        mode="staff"
        selectedStrike={selectedStrike}
      />
    </div>
  );
}